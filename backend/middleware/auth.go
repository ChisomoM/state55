package middleware

import (
	"net/http"
	"strings"

	config "backend/pkg"
	"backend/pkg/authtoken"

	"github.com/labstack/echo/v4"
)

// BearerToken extracts the token from an "Authorization: Bearer <token>" header.
func BearerToken(c echo.Context) (string, bool) {
	parts := strings.Split(c.Request().Header.Get("Authorization"), " ")
	if len(parts) != 2 || parts[0] != "Bearer" || parts[1] == "" {
		return "", false
	}
	return parts[1], true
}

// JWTMiddleware validates the access token and extracts claims into the Echo context.
// Only tokens of type "access" are accepted: refresh tokens are rejected.
// This middleware should run before TenantMiddleware.
func JWTMiddleware(cfg *config.Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Skip health checks
			if c.Request().URL.Path == "/api/v1/health" {
				return next(c)
			}

			tokenString, ok := BearerToken(c)
			if !ok {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Missing or invalid authorization header"})
			}

			// Verifies signature (HS256 only), expiry, and that this is an access token.
			claims, err := authtoken.Parse(cfg.JWTSecret, tokenString, authtoken.TypeAccess)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid or expired token"})
			}

			// Set claims to context for downstream handlers and middleware
			c.Set("user_id", claims["sub"])
			c.Set("email", claims["email"])
			c.Set("role_slug", claims["role_slug"])
			c.Set("tenant_id", claims["tenant_id"])
			c.Set("role", claims["role"])           // ControlHub: platform-level role
			c.Set("level", claims["level"])         // ControlHub: access level
			c.Set("user_type", claims["user_type"]) // User type (e.g., controlhub_admin)

			return next(c)
		}
	}
}
