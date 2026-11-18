package users

import (
	"errors"
	"net/http"

	"backend/pkg/pagination"
	"backend/pkg/response"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Handler defines user HTTP handlers.
type Handler interface {
	// Self-service (any signed-in user)
	Me(c echo.Context) error
	UpdateMe(c echo.Context) error
	ChangePassword(c echo.Context) error

	// Administration (permission-protected in routes)
	Create(c echo.Context) error
	Get(c echo.Context) error
	List(c echo.Context) error
	Update(c echo.Context) error
	Delete(c echo.Context) error
}

type handler struct {
	service Service
}

func NewHandler(service Service) Handler {
	return &handler{service: service}
}

func scopedDB(c echo.Context) *gorm.DB { return c.Get("db").(*gorm.DB) }

func callerID(c echo.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(asString(c.Get("user_id")))
	return id, err == nil
}

func asString(v interface{}) string {
	s, _ := v.(string)
	return s
}

func unauthorized(c echo.Context) error {
	return c.JSON(http.StatusUnauthorized, response.ErrorCode("unauthorized", "Authentication required"))
}

func badRequest(c echo.Context) error {
	return c.JSON(http.StatusBadRequest, response.ErrorCode("invalid_request", "Invalid request"))
}

// Me handles GET /api/v1/users/me
func (h *handler) Me(c echo.Context) error {
	id, ok := callerID(c)
	if !ok {
		return unauthorized(c)
	}
	me, err := h.service.Me(scopedDB(c), id)
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.Success(me))
}

// UpdateMe handles PUT /api/v1/users/me
func (h *handler) UpdateMe(c echo.Context) error {
	id, ok := callerID(c)
	if !ok {
		return unauthorized(c)
	}
	var req UpdateMeRequest
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	me, err := h.service.UpdateMe(scopedDB(c), id, req)
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.SuccessWithMessage("Profile updated", me))
}

// ChangePassword handles POST /api/v1/users/me/password
func (h *handler) ChangePassword(c echo.Context) error {
	id, ok := callerID(c)
	if !ok {
		return unauthorized(c)
	}
	var req ChangePasswordRequest
	if err := c.Bind(&req); err != nil || req.CurrentPassword == "" || req.NewPassword == "" {
		return badRequest(c)
	}
	if err := h.service.ChangePassword(scopedDB(c), id, req); err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.SuccessWithMessage("Password changed", nil))
}

// List handles GET /api/v1/users?page=&limit=&q=&role=&status=
func (h *handler) List(c echo.Context) error {
	page, err := h.service.List(scopedDB(c), pagination.FromQuery(c), ListQuery{
		Search: c.QueryParam("q"),
		Role:   c.QueryParam("role"),
		Status: c.QueryParam("status"),
	})
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.Success(page))
}

// Get handles GET /api/v1/users/:id
func (h *handler) Get(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return writeError(c, ErrNotFound)
	}
	user, err := h.service.Get(scopedDB(c), id)
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.Success(user))
}

// Create handles POST /api/v1/users (invites a user by email)
func (h *handler) Create(c echo.Context) error {
	caller, ok := callerID(c)
	if !ok {
		return unauthorized(c)
	}
	var req CreateUserRequest
	if err := c.Bind(&req); err != nil || req.Email == "" {
		return badRequest(c)
	}
	user, err := h.service.Create(scopedDB(c), c.Get("tenantID").(uuid.UUID), caller, req)
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusCreated, response.SuccessWithMessage("Invitation sent", user))
}

// Update handles PUT /api/v1/users/:id
func (h *handler) Update(c echo.Context) error {
	caller, ok := callerID(c)
	if !ok {
		return unauthorized(c)
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return writeError(c, ErrNotFound)
	}
	var req UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	user, err := h.service.Update(scopedDB(c), caller, id, req)
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.SuccessWithMessage("User updated", user))
}

// Delete handles DELETE /api/v1/users/:id
func (h *handler) Delete(c echo.Context) error {
	caller, ok := callerID(c)
	if !ok {
		return unauthorized(c)
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return writeError(c, ErrNotFound)
	}
	if err := h.service.Delete(scopedDB(c), caller, id); err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.SuccessWithMessage("User deleted", nil))
}

func writeError(c echo.Context, err error) error {
	status, code := http.StatusInternalServerError, "internal_error"
	message := "Something went wrong"

	switch {
	case errors.Is(err, ErrNotFound):
		status, code, message = http.StatusNotFound, "not_found", err.Error()
	case errors.Is(err, ErrInvalidEmail):
		status, code, message = http.StatusBadRequest, "invalid_email", err.Error()
	case errors.Is(err, ErrInvalidName):
		status, code, message = http.StatusBadRequest, "invalid_name", err.Error()
	case errors.Is(err, ErrWeakPassword):
		status, code, message = http.StatusBadRequest, "weak_password", err.Error()
	case errors.Is(err, ErrRoleNotFound):
		status, code, message = http.StatusBadRequest, "role_not_found", err.Error()
	case errors.Is(err, ErrEmailTaken):
		status, code, message = http.StatusConflict, "email_taken", err.Error()
	case errors.Is(err, ErrWrongPassword):
		status, code, message = http.StatusForbidden, "wrong_password", err.Error()
	case errors.Is(err, ErrCannotGrantRole):
		status, code, message = http.StatusForbidden, "cannot_grant", err.Error()
	case errors.Is(err, ErrSuperAdminOnly):
		status, code, message = http.StatusForbidden, "super_admin_only", err.Error()
	case errors.Is(err, ErrSelfChange), errors.Is(err, ErrSelfDelete):
		status, code, message = http.StatusForbidden, "self_change", err.Error()
	default:
		c.Logger().Errorf("users: unexpected error on %s %s: %v", c.Request().Method, c.Request().URL.Path, err)
	}

	return c.JSON(status, response.ErrorCode(code, message))
}
