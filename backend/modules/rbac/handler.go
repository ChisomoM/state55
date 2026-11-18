package rbac

import (
	"errors"
	"net/http"

	"backend/pkg/response"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Handler defines RBAC HTTP handlers.
type Handler interface {
	ListPermissions(c echo.Context) error
	ListRoles(c echo.Context) error
	CreateRole(c echo.Context) error
	UpdateRole(c echo.Context) error
	DeleteRole(c echo.Context) error
}

type handler struct {
	service Service
}

// NewHandler creates a new RBAC handler.
func NewHandler(service Service) Handler {
	return &handler{service: service}
}

func scopedDB(c echo.Context) *gorm.DB { return c.Get("db").(*gorm.DB) }

func callerID(c echo.Context) (uuid.UUID, error) {
	id, _ := c.Get("user_id").(string)
	return uuid.Parse(id)
}

// ListPermissions handles GET /api/v1/admin/permissions
func (h *handler) ListPermissions(c echo.Context) error {
	perms, err := h.service.ListPermissions(scopedDB(c))
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.Success(perms))
}

// ListRoles handles GET /api/v1/admin/roles
func (h *handler) ListRoles(c echo.Context) error {
	roles, err := h.service.ListRoles(scopedDB(c))
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.Success(roles))
}

// CreateRole handles POST /api/v1/admin/roles
func (h *handler) CreateRole(c echo.Context) error {
	var req CreateRoleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorCode("invalid_request", "Invalid request"))
	}
	caller, err := callerID(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorCode("unauthorized", "Authentication required"))
	}

	role, err := h.service.CreateRole(scopedDB(c), c.Get("tenantID").(uuid.UUID), caller, req)
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusCreated, response.SuccessWithMessage("Role created", role))
}

// UpdateRole handles PUT /api/v1/admin/roles/:id
func (h *handler) UpdateRole(c echo.Context) error {
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorCode("not_found", ErrNotFound.Error()))
	}
	var req UpdateRoleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorCode("invalid_request", "Invalid request"))
	}
	caller, err := callerID(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, response.ErrorCode("unauthorized", "Authentication required"))
	}

	role, err := h.service.UpdateRole(scopedDB(c), caller, roleID, req)
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.SuccessWithMessage("Role updated", role))
}

// DeleteRole handles DELETE /api/v1/admin/roles/:id
func (h *handler) DeleteRole(c echo.Context) error {
	roleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusNotFound, response.ErrorCode("not_found", ErrNotFound.Error()))
	}

	if err := h.service.DeleteRole(scopedDB(c), roleID); err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.SuccessWithMessage("Role deleted", nil))
}

func writeError(c echo.Context, err error) error {
	status, code := http.StatusInternalServerError, "internal_error"
	message := "Something went wrong"

	switch {
	case errors.Is(err, ErrNotFound):
		status, code, message = http.StatusNotFound, "not_found", err.Error()
	case errors.Is(err, ErrInvalidName):
		status, code, message = http.StatusBadRequest, "invalid_name", err.Error()
	case errors.Is(err, ErrInvalidSlug):
		status, code, message = http.StatusBadRequest, "invalid_slug", err.Error()
	case errors.Is(err, ErrUnknownPerm):
		status, code, message = http.StatusBadRequest, "unknown_permission", err.Error()
	case errors.Is(err, ErrSlugTaken):
		status, code, message = http.StatusConflict, "slug_taken", err.Error()
	case errors.Is(err, ErrRoleInUse):
		status, code, message = http.StatusConflict, "role_in_use", err.Error()
	case errors.Is(err, ErrSystemRole):
		status, code, message = http.StatusForbidden, "system_role", err.Error()
	case errors.Is(err, ErrCannotGrant):
		status, code, message = http.StatusForbidden, "cannot_grant", err.Error()
	default:
		c.Logger().Errorf("rbac: unexpected error on %s %s: %v", c.Request().Method, c.Request().URL.Path, err)
	}

	return c.JSON(status, response.ErrorCode(code, message))
}
