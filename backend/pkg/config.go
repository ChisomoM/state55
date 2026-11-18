package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

// Config holds all configuration for the application.
type Config struct {
	// Application
	Port       string
	Env        string
	AppBaseURL string // Public web URL, used to build links in emails (e.g., http://localhost:5173)

	// Multi-tenancy
	MultiTenantEnabled bool
	DefaultTenantID    string // Must be a UUID; the default tenant is created at startup if missing.

	// Database
	DBHost     string
	DBPort     string
	DBUsername string
	DBPassword string
	DBName     string

	// Connection pool tuning
	DBPoolMaxOpen int
	DBPoolMaxIdle int

	// Redis + background jobs
	RedisURL         string // e.g., redis://localhost:6379/0
	AsynqConcurrency int

	// CORS
	CORSAllowedOrigins string // Comma-separated, e.g., "http://localhost:3000,http://localhost:5173"

	// JWT / auth
	JWTSecret       string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration

	// Reverse proxies whose X-Forwarded-For header is trusted for the client IP (CIDRs). Empty
	// means no proxy: the connection's address is used. Needed for correct rate limiting behind
	// Coolify/Traefik; never trust forwarded headers from arbitrary clients.
	TrustedProxies []string

	// Optional first-run admin. If no super_admin exists, this account is created (email already
	// verified). Remove the password after first use.
	BootstrapAdminEmail    string
	BootstrapAdminPassword string

	// Email (SMTP)
	SMTPHost      string
	SMTPPort      string
	SMTPUsername  string
	SMTPPassword  string
	SMTPFromEmail string
	// SkipEmails turns off outgoing email: queued messages are logged and marked "skipped"
	// instead of being sent. For local setup only; Validate refuses it in production.
	SkipEmails bool

	// File storage (MinIO). Disabled when MinioEndpoint is empty.
	MinioEndpoint      string // host:port, e.g., localhost:9000
	MinioUseSSL        bool
	MinioAccessKey     string
	MinioSecretKey     string
	MinioPublicBucket  string // Anonymous read; profile photos, story images, banners
	MinioPrivateBucket string // Never public; cards, documents, member files (presigned URLs only)
	MinioPublicURL     string // Browser-reachable base URL for the public bucket
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	// Load .env file if it exists (for local dev)
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		log.Printf("Warning: .env file not found or error reading it: %v", err)
	}

	cfg := &Config{
		Port:               getEnv("APP_PORT", "8080"),
		Env:                getEnv("APP_ENV", "development"),
		AppBaseURL:         getEnv("APP_BASE_URL", "http://localhost:5173"),
		MultiTenantEnabled: getEnvBool("MULTI_TENANT_ENABLED", true),
		DefaultTenantID:    getEnv("DEFAULT_TENANT_ID", ""),
		DBHost:             getEnv("DB_HOST", "localhost"),
		DBPort:             getEnv("DB_PORT", "5432"),
		DBUsername:         getEnv("DB_USERNAME", "postgres"),
		DBPassword:         getEnv("DB_PASSWORD", ""),
		DBName:             getEnv("DB_NAME", "template_db"),
		DBPoolMaxOpen:      getEnvInt("DB_POOL_MAX_OPEN", 25),
		DBPoolMaxIdle:      getEnvInt("DB_POOL_MAX_IDLE", 5),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379/0"),
		AsynqConcurrency:   getEnvInt("ASYNQ_CONCURRENCY", 10),
		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"),
		JWTSecret:          getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		AccessTokenTTL:     time.Duration(getEnvInt("ACCESS_TOKEN_TTL_MINUTES", 4*60)) * time.Minute,
		RefreshTokenTTL:    time.Duration(getEnvInt("REFRESH_TOKEN_TTL_HOURS", 24*30)) * time.Hour,
		TrustedProxies:     splitCSV(getEnv("TRUSTED_PROXIES", "")),

		BootstrapAdminEmail:    strings.ToLower(getEnv("BOOTSTRAP_ADMIN_EMAIL", "")),
		BootstrapAdminPassword: getEnv("BOOTSTRAP_ADMIN_PASSWORD", ""),
		SMTPHost:               getEnv("SMTP_HOST", ""),
		SMTPPort:               getEnv("SMTP_PORT", "587"),
		SMTPUsername:           getEnv("SMTP_USERNAME", ""),
		SMTPPassword:           getEnv("SMTP_PASSWORD", ""),
		SMTPFromEmail:          getEnv("SMTP_FROM_EMAIL", ""),
		SkipEmails:             getEnvBool("SKIP_EMAILS", false),
		MinioEndpoint:         getEnv("MINIO_ENDPOINT", ""),
		MinioUseSSL:            getEnvBool("MINIO_USE_SSL", false),
		MinioAccessKey:         getEnv("MINIO_ACCESS_KEY", ""),
		MinioSecretKey:         getEnv("MINIO_SECRET_KEY", ""),
		MinioPublicBucket:      getEnv("MINIO_PUBLIC_BUCKET", "media-public"),
		MinioPrivateBucket:     getEnv("MINIO_PRIVATE_BUCKET", "private"),
		MinioPublicURL:         getEnv("MINIO_PUBLIC_URL", ""),
	}

	return cfg, nil
}

// Validate checks that required configuration is present.
func (c *Config) Validate() error {
	var missing []string

	if c.DBHost == "" {
		missing = append(missing, "DB_HOST")
	}
	if c.DBPort == "" {
		missing = append(missing, "DB_PORT")
	}
	if c.DBName == "" {
		missing = append(missing, "DB_NAME")
	}
	if c.JWTSecret == "" || c.JWTSecret == "your-secret-key-change-in-production" {
		missing = append(missing, "JWT_SECRET (must be set to a secure value)")
	}
	if c.RedisURL == "" {
		missing = append(missing, "REDIS_URL")
	}
	if _, err := uuid.Parse(c.DefaultTenantID); err != nil {
		missing = append(missing, "DEFAULT_TENANT_ID (must be a UUID)")
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing or invalid environment variables: %s", strings.Join(missing, ", "))
	}

	// Skipped emails are logged in plain text (including verify and reset links), and members could
	// never verify or recover their accounts. Never allow it in production.
	if c.SkipEmails && strings.EqualFold(c.Env, "production") {
		return fmt.Errorf("SKIP_EMAILS=true is not allowed when APP_ENV=production")
	}

	return nil
}

// DefaultTenantUUID returns DefaultTenantID parsed as a UUID. Validate must have passed.
func (c *Config) DefaultTenantUUID() uuid.UUID {
	return uuid.MustParse(c.DefaultTenantID)
}

func splitCSV(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

// getEnv gets an environment variable with a default.
func getEnv(key, defaultVal string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultVal
}

// getEnvBool gets a boolean environment variable with a default.
func getEnvBool(key string, defaultVal bool) bool {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	b, err := strconv.ParseBool(val)
	if err != nil {
		return defaultVal
	}
	return b
}

// getEnvInt gets an integer environment variable with a default.
func getEnvInt(key string, defaultVal int) int {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	i, err := strconv.Atoi(val)
	if err != nil {
		return defaultVal
	}
	return i
}
