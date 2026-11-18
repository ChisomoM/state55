package middleware

import (
	"encoding/json"
	"strings"

	"backend/models"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// AuditMiddleware logs state-changing operations (POST, PUT, PATCH, DELETE) after they run, so
// each entry records the outcome (HTTP status). Failed and denied attempts are logged too.
// Request bodies are never logged (they can hold passwords and tokens).
// Attach this to route groups to automatically log all mutations.
func AuditMiddleware(db *gorm.DB, logger *zap.SugaredLogger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()

			// Skip audit for non-mutating requests
			if req.Method == "GET" || req.Method == "HEAD" || req.Method == "OPTIONS" {
				return next(c)
			}

			userID, err := uuid.Parse(asString(c.Get("user_id")))
			if err != nil {
				return next(c)
			}
			tenantID, err := uuid.Parse(asString(c.Get("tenant_id")))
			if err != nil {
				return next(c)
			}

			// Run the handler first so the outcome is known.
			handlerErr := next(c)

			status := c.Response().Status
			if he, ok := handlerErr.(*echo.HTTPError); ok {
				status = he.Code
			}

			details, _ := json.Marshal(map[string]interface{}{
				"path":   req.URL.Path,
				"route":  c.Path(), // pattern, e.g. /api/v1/users/:id
				"status": status,
			})

			auditLog := models.AuditLog{
				TenantBaseModel: models.TenantBaseModel{TenantID: tenantID},
				UserID:          userID,
				Action:          req.Method,
				Resource:        resourceFromPath(req.URL.Path),
				ResourceID:      c.Param("id"),
				IPAddress:       c.RealIP(),
				UserAgent:       req.Header.Get("User-Agent"),
				Details:         string(details),
			}

			if err := db.Session(&gorm.Session{NewDB: true}).Create(&auditLog).Error; err != nil {
				logger.Warnf("Failed to log audit: %v", err)
			}

			return handlerErr
		}
	}
}

// resourceFromPath extracts the resource type from the URL path, skipping the /api/v1 prefix and
// the "admin" namespace. e.g. "/api/v1/users/123" -> "users", "/api/v1/admin/roles/7" -> "roles".
func resourceFromPath(path string) string {
	parts := split(path, "/")
	if len(parts) >= 2 && parts[0] == "api" {
		parts = parts[2:] // drop "api", "v1"
	}
	if len(parts) > 0 && parts[0] == "admin" {
		parts = parts[1:]
	}
	if len(parts) > 0 {
		return parts[0]
	}
	return ""
}

// split is a helper for path splitting.
func split(s, sep string) []string {
	var result []string
	for _, part := range strings.Split(s, sep) {
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}
