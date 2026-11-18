package middleware

import (
	"backend/models"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// TenantMiddleware resolves the tenant from the validated JWT claims and attaches
// a WHERE-scoped *gorm.DB to the Echo context for automatic tenant isolation.
// This middleware must run after JWTMiddleware so that "tenant_id" is already in context.
//
// The resolved tenant is available to handlers as c.Get("tenantID").(uuid.UUID).
//
// When MULTI_TENANT_ENABLED=false, requests are scoped to DEFAULT_TENANT_ID regardless of the token.
// When true, all handler queries are automatically filtered by the token's tenant_id.
func TenantMiddleware(cfg TenantConfig) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Single-tenant mode: everything lives in the default tenant. Handlers still receive a
			// scoped "db" (scoped to that one tenant) so they work the same in both modes.
			if !cfg.MultiTenantEnabled {
				return scopeToTenant(c, cfg, cfg.DefaultTenantID, next)
			}

			// tenant_id is set in context by JWTMiddleware after validating the token.
			claim, _ := c.Get("tenant_id").(string)
			tenantID, err := uuid.Parse(claim)
			if err != nil {
				cfg.Logger.Warnf("No valid tenant_id in JWT context for request: %s", c.Request().URL.Path)
				return echo.NewHTTPError(401, "Authentication required")
			}

			return scopeToTenant(c, cfg, tenantID, next)
		}
	}
}

// PublicTenantMiddleware resolves the tenant for unauthenticated routes (register, login, password
// reset). There is no JWT yet, so the tenant comes from the X-Tenant-ID header when multi-tenancy is
// enabled, and otherwise falls back to DEFAULT_TENANT_ID.
func PublicTenantMiddleware(cfg TenantConfig) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			tenantID := cfg.DefaultTenantID

			if cfg.MultiTenantEnabled {
				if header := c.Request().Header.Get("X-Tenant-ID"); header != "" {
					parsed, err := uuid.Parse(header)
					if err != nil {
						return echo.NewHTTPError(400, "Invalid X-Tenant-ID")
					}
					tenantID = parsed
				}
			}

			// Single-tenant mode still needs a tenant row to attach new users to.
			return scopeToTenant(c, cfg, tenantID, next)
		}
	}
}

// PlatformDBMiddleware attaches the unscoped database to the context for platform-level routes
// (ControlHub login), which authenticate across all tenants.
func PlatformDBMiddleware(db *gorm.DB) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("db", db)
			return next(c)
		}
	}
}

// scopeToTenant verifies the tenant exists and stores the scoped DB and tenant ID in the context.
func scopeToTenant(c echo.Context, cfg TenantConfig, tenantID uuid.UUID, next echo.HandlerFunc) error {
	var count int64
	if err := cfg.DB.Model(&models.Tenant{}).
		Where("id = ? AND is_active = true", tenantID).
		Count(&count).Error; err != nil || count == 0 {
		cfg.Logger.Warnf("Tenant not found or inactive: %s", tenantID)
		return echo.NewHTTPError(404, "Tenant not found")
	}

	c.Set("tenantID", tenantID)

	// Attach a WHERE-scoped session so every handler query is automatically
	// tenant-scoped without any per-query effort.
	// Session(NewDB:false) preserves the WHERE clause across Preload().
	scopedDB := cfg.DB.Where("tenant_id = ?", tenantID).Session(&gorm.Session{NewDB: false})
	c.Set("db", scopedDB)

	return next(c)
}

// TenantConfig holds configuration for the tenant middlewares.
type TenantConfig struct {
	DB                 *gorm.DB
	Logger             *zap.SugaredLogger
	MultiTenantEnabled bool
	DefaultTenantID    uuid.UUID // Used by PublicTenantMiddleware when no tenant is specified
}
