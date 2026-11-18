package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"backend/db"
	"backend/global"
	"backend/infra/cache"
	appmail "backend/infra/mail"
	"backend/infra/outbox"
	"backend/infra/queue"
	"backend/infra/ratelimit"
	"backend/infra/storage"
	"backend/middleware"
	"backend/modules/audit"
	"backend/modules/auth"
	"backend/modules/controlhub"
	"backend/modules/notifications"
	"backend/modules/rbac"
	"backend/modules/users"
	config "backend/pkg"
	"backend/routes"

	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

func main() {
	// Initialize structured logger
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()
	sugar := logger.Sugar()

	// Load and validate configuration
	cfg, err := config.Load()
	if err != nil {
		sugar.Fatalf("Failed to load configuration: %v", err)
	}
	if err := cfg.Validate(); err != nil {
		sugar.Fatalf("Configuration validation failed: %v", err)
	}

	sugar.Infof("Starting application in %s environment", cfg.Env)
	sugar.Infof("Multi-tenancy: %v", cfg.MultiTenantEnabled)

	// Initialize database connection.
	if err := db.Initialize(cfg, sugar); err != nil {
		sugar.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Run AutoMigrate (MVP: GORM AutoMigrate; switch to versioned SQL migrations before production)
	if err := db.AutoMigrate(db.GetDB(), sugar); err != nil {
		sugar.Fatalf("AutoMigrate failed: %v", err)
	}

	// The default tenant always exists: public routes (register, login) resolve to it.
	if err := db.SeedDefaultTenant(db.GetDB(), cfg.DefaultTenantUUID(), sugar); err != nil {
		sugar.Fatalf("Failed to seed default tenant: %v", err)
	}
	if err := db.SeedDefaultRoles(db.GetDB(), cfg.DefaultTenantUUID(), sugar); err != nil {
		// Without the permission catalogue and built-in roles, authorization cannot work.
		sugar.Fatalf("Failed to seed permissions and roles: %v", err)
	}
	if err := bootstrapAdmin(db.GetDB(), cfg, sugar); err != nil {
		sugar.Fatalf("Failed to create the bootstrap admin: %v", err)
	}

	// Redis (shared by the job queue, rate limiting and later caches)
	startCtx, cancelStart := context.WithTimeout(context.Background(), 15*time.Second)
	redisClient, err := cache.NewRedis(startCtx, cfg.RedisURL)
	if err != nil {
		cancelStart()
		sugar.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Infrastructure services. Typed nil pointers must not be stored in the interface fields,
	// so each is assigned only when configured.
	var emailService global.EmailSender
	smtpSender := appmail.NewSMTPSender(cfg)
	if smtpSender != nil {
		emailService = smtpSender
	}
	switch {
	case cfg.SkipEmails:
		sugar.Warn("SKIP_EMAILS is on: no email will be sent. Messages are written to this log and marked skipped.")
	case smtpSender == nil:
		sugar.Warn("SMTP_HOST not set: emails will queue but not be sent")
	}

	var uploadService global.FileUploader
	minioStore, err := storage.New(startCtx, cfg)
	cancelStart()
	if err != nil {
		sugar.Fatalf("Failed to initialize file storage: %v", err)
	}
	if minioStore != nil {
		uploadService = minioStore
		sugar.Infof("File storage ready (buckets: %s public, %s private)", cfg.MinioPublicBucket, cfg.MinioPrivateBucket)
	} else {
		sugar.Warn("MINIO_ENDPOINT not set: file storage disabled")
	}

	// Initialize the shared App infrastructure (passed to all modules)
	app := global.New(cfg, sugar, emailService, uploadService, redisClient)
	sugar.Info("App infrastructure initialized")

	// Background jobs: the Asynq server runs inside this process. Modules write jobs to the outbox
	// in their own transactions; the dispatcher moves them into the queue.
	queueClient, err := queue.NewClient(cfg.RedisURL)
	if err != nil {
		sugar.Fatalf("Failed to create queue client: %v", err)
	}
	defer queueClient.Close()

	queueServer, err := queue.NewServer(cfg.RedisURL, cfg.AsynqConcurrency, sugar)
	if err != nil {
		sugar.Fatalf("Failed to create queue server: %v", err)
	}
	queueServer.Handle(appmail.TypeSend, appmail.HandleSend(smtpSender, db.GetDB(), cfg.SkipEmails, sugar))
	if err := queueServer.Start(); err != nil {
		sugar.Fatalf("Failed to start queue server: %v", err)
	}

	dispatcherCtx, stopDispatcher := context.WithCancel(context.Background())
	go outbox.NewDispatcher(db.GetDB(), queueClient, sugar, 2*time.Second).Run(dispatcherCtx)

	// Rate limits live in Redis so every API instance shares the same counters.
	limiter := ratelimit.New(redisClient)

	// Initialize modules
	authService := auth.NewService(app)
	authHandler := auth.NewHandler(authService, limiter)

	usersService := users.NewService(app)
	usersHandler := users.NewHandler(usersService)

	rbacService := rbac.NewService(app)
	rbacHandler := rbac.NewHandler(rbacService)

	controlhubService := controlhub.NewService(app)
	controlhubHandler := controlhub.NewHandler(controlhubService)

	auditHandler := audit.NewHandler()
	notificationsHandler := notifications.NewHandler()

	// Create Echo router
	e := echo.New()

	// Client IPs (used by rate limiting and the audit log). Forwarded headers are only believed
	// when they come from a configured proxy; otherwise any client could spoof its address.
	ipExtractor, err := newIPExtractor(cfg.TrustedProxies)
	if err != nil {
		sugar.Fatalf("Invalid TRUSTED_PROXIES: %v", err)
	}
	e.IPExtractor = ipExtractor

	// Global middleware
	e.Use(middleware.LoggerMiddleware(sugar))
	e.Use(middleware.CORSMiddleware(middleware.CORSConfig{
		AllowedOrigins: parseCORSOrigins(cfg.CORSAllowedOrigins),
		Logger:         sugar,
	}))

	// Health checks (no auth required)
	// Liveness: the process is up.
	e.GET("/api/v1/health", func(c echo.Context) error {
		return c.JSON(200, map[string]string{"status": "ok"})
	})
	// Readiness: dependencies are reachable. 503 tells a load balancer to stop sending traffic.
	e.GET("/api/v1/ready", readiness(redisClient, minioStore))

	tenantCfg := middleware.TenantConfig{
		DB:                 db.GetDB(),
		Logger:             sugar,
		MultiTenantEnabled: cfg.MultiTenantEnabled,
		DefaultTenantID:    cfg.DefaultTenantUUID(),
	}

	// Public auth routes. No JWT yet, so the tenant comes from X-Tenant-ID or the default tenant.
	publicAPI := e.Group("/api/v1/auth", middleware.PublicTenantMiddleware(tenantCfg))
	routes.SetupAuthRoutes(publicAPI, authHandler, limiter)

	// ControlHub routes (platform-level, separate from tenant auth)
	routes.SetupControlHubRoutes(e, controlhubHandler, cfg, db.GetDB(), limiter)

	// Protected routes (with JWT + Tenant middleware)
	api := e.Group("/api/v1", middleware.JWTMiddleware(cfg))
	api.Use(middleware.TenantMiddleware(tenantCfg))

	// Attach audit middleware for state-changing requests
	api.Use(middleware.AuditMiddleware(db.GetDB(), sugar))

	// Register protected routes
	routes.SetupUserRoutes(api, usersHandler, sugar, limiter)
	routes.SetupNotificationRoutes(api, notificationsHandler)
	routes.SetupAdminRoutes(api, rbacHandler, auditHandler, notificationsHandler, sugar)

	// Start server with graceful shutdown
	go func() {
		if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
			sugar.Errorf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// Graceful shutdown: stop taking requests, stop moving jobs, let running jobs finish.
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		sugar.Errorf("Shutdown error: %v", err)
	}
	stopDispatcher()
	queueServer.Shutdown()

	sugar.Info("Server stopped")
}

// readiness reports whether Postgres, Redis and (if enabled) MinIO are reachable.
func readiness(redisClient *redis.Client, minioStore *storage.MinIO) echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx, cancel := context.WithTimeout(c.Request().Context(), 3*time.Second)
		defer cancel()

		checks := map[string]string{}
		ready := true
		record := func(name string, err error) {
			if err != nil {
				checks[name] = "unavailable"
				ready = false
				return
			}
			checks[name] = "ok"
		}

		record("postgres", db.Ping(ctx))
		record("redis", redisClient.Ping(ctx).Err())
		if minioStore != nil {
			record("minio", minioStore.Ping(ctx))
		}

		status, label := http.StatusOK, "ready"
		if !ready {
			status, label = http.StatusServiceUnavailable, "unavailable"
		}
		return c.JSON(status, map[string]interface{}{"status": label, "checks": checks})
	}
}

// newIPExtractor decides how the client IP is determined. With no trusted proxies the TCP peer
// address is used (forwarded headers are ignored). With proxies listed (CIDRs), X-Forwarded-For is
// honoured only for requests arriving from those proxies.
func newIPExtractor(trustedProxies []string) (echo.IPExtractor, error) {
	if len(trustedProxies) == 0 {
		return echo.ExtractIPDirect(), nil
	}

	var options []echo.TrustOption
	for _, cidr := range trustedProxies {
		_, network, err := net.ParseCIDR(cidr)
		if err != nil {
			return nil, err
		}
		options = append(options, echo.TrustIPRange(network))
	}
	return echo.ExtractIPFromXFFHeader(options...), nil
}

// parseCORSOrigins parses comma-separated CORS origins.
func parseCORSOrigins(originsStr string) []string {
	var origins []string
	for _, o := range strings.Split(originsStr, ",") {
		if o = strings.TrimSpace(o); o != "" {
			origins = append(origins, o)
		}
	}
	if len(origins) == 0 {
		return []string{"http://localhost:3000", "http://localhost:5173"}
	}
	return origins
}
