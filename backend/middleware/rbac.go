package middleware

import (
	"net/http"

	"backend/authz"
	"backend/models"
	"backend/pkg/response"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// Context keys set by RBACMiddleware / ScopeMiddleware for handlers that need them.
const (
	ctxCurrentUser = "current_user" // *models.User, loaded fresh from the database
	ctxPermissions = "permissions"  // map[string]bool
)

// authorize loads the caller's current user and permissions from the database (not from the JWT,
// so role changes and deactivation apply immediately) and stores them in the context.
// It writes the error response itself and returns false when the request must stop.
func authorize(c echo.Context, logger *zap.SugaredLogger) (*models.User, map[string]bool, bool) {
	userID, err := uuid.Parse(asString(c.Get("user_id")))
	if err != nil {
		_ = c.JSON(http.StatusUnauthorized, response.ErrorCode("unauthorized", "Authentication required"))
		return nil, nil, false
	}

	db, ok := c.Get("db").(*gorm.DB)
	if !ok {
		logger.Errorf("authorize: no tenant db in context for %s", c.Path())
		_ = c.JSON(http.StatusInternalServerError, response.ErrorCode("internal_error", "Something went wrong"))
		return nil, nil, false
	}

	user, perms, err := authz.LoadPermissions(db, userID)
	if err != nil {
		logger.Warnf("authorize: failed to load permissions for %s: %v", userID, err)
		_ = c.JSON(http.StatusForbidden, response.ErrorCode("forbidden", "Access denied"))
		return nil, nil, false
	}
	if !user.IsActive {
		_ = c.JSON(http.StatusForbidden, response.ErrorCode("account_inactive", "This account is inactive"))
		return nil, nil, false
	}

	c.Set(ctxCurrentUser, user)
	c.Set(ctxPermissions, perms)
	return user, perms, true
}

// RBACMiddleware allows the request only if the current user holds at least one of the required
// permission codes. Use per route:
//
//	api.POST("/users", h.Create, middleware.RBACMiddleware(logger, "users.create"))
func RBACMiddleware(logger *zap.SugaredLogger, requiredCodes ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user, perms, ok := authorize(c, logger)
			if !ok {
				return nil
			}

			if !authz.HasAny(perms, requiredCodes...) {
				logger.Warnf("user %s denied (role=%s, required=%v)", user.ID, user.RoleSlug, requiredCodes)
				return c.JSON(http.StatusForbidden, response.ErrorCode("forbidden", "Insufficient permissions"))
			}
			return next(c)
		}
	}
}

// ScopeMiddleware allows the request if the user holds one of `orPermissions` globally (for
// example an admin permission), OR is authorized for the specific resource named by the route
// parameter `param` according to the checker registered for `scope`:
//
//	api.PUT("/organizations/:id", h.Update, middleware.ScopeMiddleware(logger, "organization", "id", "org.update"))
//
// It fails closed: if no checker is registered for the scope, only the global permissions apply.
func ScopeMiddleware(logger *zap.SugaredLogger, scope, param string, orPermissions ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			user, perms, ok := authorize(c, logger)
			if !ok {
				return nil
			}

			if authz.HasAny(perms, orPermissions...) {
				return next(c)
			}

			if checker, found := authz.LookupScope(scope); found {
				if resourceID, err := uuid.Parse(c.Param(param)); err == nil {
					db := c.Get("db").(*gorm.DB)
					allowed, err := checker(db, user.ID, resourceID)
					if err != nil {
						logger.Errorf("scope check %q failed: %v", scope, err)
						return c.JSON(http.StatusInternalServerError, response.ErrorCode("internal_error", "Something went wrong"))
					}
					if allowed {
						return next(c)
					}
				}
			}

			logger.Warnf("user %s denied for scope %q", user.ID, scope)
			return c.JSON(http.StatusForbidden, response.ErrorCode("forbidden", "Insufficient permissions"))
		}
	}
}

// CurrentUser returns the user loaded by RBACMiddleware/ScopeMiddleware, if they ran on this route.
func CurrentUser(c echo.Context) (*models.User, bool) {
	u, ok := c.Get(ctxCurrentUser).(*models.User)
	return u, ok
}

func asString(v interface{}) string {
	s, _ := v.(string)
	return s
}
