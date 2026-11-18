package routes

import (
	"time"

	"backend/infra/ratelimit"
	"backend/middleware"
	"backend/modules/audit"
	"backend/modules/auth"
	"backend/modules/controlhub"
	"backend/modules/notifications"
	"backend/modules/rbac"
	"backend/modules/users"
	config "backend/pkg"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// SetupAuthRoutes registers public authentication routes.
// The group must use PublicTenantMiddleware, which supplies the tenant-scoped DB these handlers need.
//
// Every route has a per-IP limit (budgets are separate per route). The handlers add per-account
// limits (per email) on top. Limits fail closed if Redis is down.
func SetupAuthRoutes(g *echo.Group, handler auth.Handler, limiter *ratelimit.Limiter) {
	limit := func(name string, n int, window time.Duration) echo.MiddlewareFunc {
		return middleware.RateLimit(limiter, name, n, window, middleware.ByIP)
	}

	g.POST("/login", handler.Login, limit("login", 30, 15*time.Minute))
	g.POST("/register", handler.Register, limit("register", 10, time.Hour))
	g.POST("/refresh", handler.RefreshToken, limit("refresh", 120, time.Hour))
	g.POST("/verify-email", handler.VerifyEmail, limit("verify-email", 30, time.Hour))
	g.POST("/resend-verification", handler.ResendVerification, limit("resend", 10, time.Hour))
	g.POST("/forgot-password", handler.RequestPasswordReset, limit("forgot", 10, time.Hour))
	g.POST("/reset-password", handler.ResetPassword, limit("reset", 30, time.Hour))
}

// SetupControlHubRoutes registers ControlHub routes (platform-level, not tenant-scoped).
// These routes are separate from tenant routes and should be registered at the root Echo level.
// platformDB is the unscoped database used to authenticate company admins across tenants.
func SetupControlHubRoutes(e *echo.Echo, handler controlhub.Handler, cfg *config.Config, platformDB *gorm.DB, limiter *ratelimit.Limiter) {
	// ControlHub Auth — completely separate from tenant auth
	// Uses /controlhub/auth path (without /api/v1) to distinguish from tenant auth
	auth := e.Group("/controlhub/auth", middleware.PlatformDBMiddleware(platformDB))
	{
		auth.POST("/login", handler.LoginCompanyAdmin, middleware.RateLimit(limiter, "controlhub-login", 10, 15*time.Minute, middleware.ByIP))
		auth.POST("/refresh", handler.RefreshToken)
		auth.POST("/logout", handler.Logout)
	}

	// Protected ControlHub routes — require JWT + ControlHubOnly middleware
	controlhubAPI := e.Group("/api/v1/controlhub")
	controlhubAPI.Use(middleware.JWTMiddleware(cfg))
	controlhubAPI.Use(middleware.ControlHubOnly())
	// Additional protected ControlHub routes can be registered here (tenants, clients, etc.)
}

// SetupUserRoutes registers user routes (protected).
//
// /users/me* are open to any signed-in user. The rest are administration, guarded by permissions;
// the service adds further rules (nobody can grant more than they hold, only super admins manage
// super admins, nobody can demote or delete themselves).
func SetupUserRoutes(g *echo.Group, handler users.Handler, logger *zap.SugaredLogger, limiter *ratelimit.Limiter) {
	g.GET("/users/me", handler.Me)
	g.PUT("/users/me", handler.UpdateMe)
	g.POST("/users/me/password", handler.ChangePassword,
		middleware.RateLimit(limiter, "change-password", 10, 15*time.Minute, middleware.ByUser))

	g.GET("/users", handler.List, middleware.RBACMiddleware(logger, "users.read"))
	g.GET("/users/:id", handler.Get, middleware.RBACMiddleware(logger, "users.read"))
	g.POST("/users", handler.Create, middleware.RBACMiddleware(logger, "users.create"))
	g.PUT("/users/:id", handler.Update, middleware.RBACMiddleware(logger, "users.update"))
	g.DELETE("/users/:id", handler.Delete, middleware.RBACMiddleware(logger, "users.delete"))
}

// SetupAdminRoutes registers the admin console's APIs under /api/v1/admin (protected):
// roles and permissions, the audit log and the email delivery log.
func SetupAdminRoutes(g *echo.Group, rbacHandler rbac.Handler, auditHandler audit.Handler, notifHandler notifications.Handler, logger *zap.SugaredLogger) {
	admin := g.Group("/admin")

	admin.GET("/permissions", rbacHandler.ListPermissions, middleware.RBACMiddleware(logger, "roles.read"))
	admin.GET("/roles", rbacHandler.ListRoles, middleware.RBACMiddleware(logger, "roles.read"))
	admin.POST("/roles", rbacHandler.CreateRole, middleware.RBACMiddleware(logger, "roles.create"))
	admin.PUT("/roles/:id", rbacHandler.UpdateRole, middleware.RBACMiddleware(logger, "roles.update"))
	admin.DELETE("/roles/:id", rbacHandler.DeleteRole, middleware.RBACMiddleware(logger, "roles.delete"))

	admin.GET("/audit-logs", auditHandler.List, middleware.RBACMiddleware(logger, "audit.read"))
	admin.GET("/email-log", notifHandler.EmailLog, middleware.RBACMiddleware(logger, "email_log.read"))
}

// SetupNotificationRoutes registers a member's own notification settings (any signed-in user).
func SetupNotificationRoutes(g *echo.Group, handler notifications.Handler) {
	g.GET("/notifications/preferences", handler.GetPreferences)
	g.PUT("/notifications/preferences", handler.UpdatePreferences)
}
