package auth

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"backend/infra/ratelimit"
	"backend/middleware"
	"backend/pkg/response"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// Handler defines auth HTTP handlers.
type Handler interface {
	Login(c echo.Context) error
	Register(c echo.Context) error
	RefreshToken(c echo.Context) error
	RequestPasswordReset(c echo.Context) error
	ResetPassword(c echo.Context) error
	VerifyEmail(c echo.Context) error
	ResendVerification(c echo.Context) error
}

// handler implements Handler.
type handler struct {
	service Service
	limiter *ratelimit.Limiter // per-account limits; per-IP limits are applied on the routes
}

// NewHandler creates a new auth handler. limiter may be nil (no per-account limits, e.g. in tests).
func NewHandler(service Service, limiter *ratelimit.Limiter) Handler {
	return &handler{service: service, limiter: limiter}
}

// allow applies a per-account limit; it writes the 429/503 response itself when the request must stop.
func (h *handler) allow(c echo.Context, name, subject string, limit int, window time.Duration) bool {
	return middleware.AllowRequest(c, h.limiter, name, ratelimit.Hash(subject), limit, window)
}

// Public auth routes sit behind PublicTenantMiddleware, which provides the tenant-scoped DB and tenant ID.
func requestContext(c echo.Context) (*gorm.DB, uuid.UUID) {
	return c.Get("db").(*gorm.DB), c.Get("tenantID").(uuid.UUID)
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// Login handles POST /api/v1/auth/login
func (h *handler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil || req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, response.Error("Email and password are required"))
	}
	db, tenantID := requestContext(c)

	// Stops password guessing against one account even when it comes from many IPs.
	if !h.allow(c, "login-email", normalizeEmail(req.Email), 8, 15*time.Minute) {
		return nil
	}

	resp, err := h.service.Login(db, tenantID, normalizeEmail(req.Email), req.Password)
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.Success(resp))
}

// Register handles POST /api/v1/auth/register
func (h *handler) Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil || req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, response.Error("Email and password are required"))
	}
	db, tenantID := requestContext(c)

	resp, err := h.service.Register(db, tenantID, normalizeEmail(req.Email), req.Password, req.FirstName, req.LastName)
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusCreated, response.SuccessWithMessage("Account created. Check your email to verify your address.", resp))
}

// RefreshToken handles POST /api/v1/auth/refresh
func (h *handler) RefreshToken(c echo.Context) error {
	var req RefreshTokenRequest
	if err := c.Bind(&req); err != nil || req.RefreshToken == "" {
		return c.JSON(http.StatusBadRequest, response.Error("refresh_token is required"))
	}
	db, _ := requestContext(c)

	resp, err := h.service.RefreshToken(db, req.RefreshToken)
	if err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.Success(resp))
}

// VerifyEmail handles POST /api/v1/auth/verify-email
func (h *handler) VerifyEmail(c echo.Context) error {
	var req VerifyEmailRequest
	if err := c.Bind(&req); err != nil || req.Token == "" {
		return c.JSON(http.StatusBadRequest, response.Error("token is required"))
	}
	db, _ := requestContext(c)

	if err := h.service.VerifyEmail(db, req.Token); err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.SuccessWithMessage("Email verified", nil))
}

// ResendVerification handles POST /api/v1/auth/resend-verification
func (h *handler) ResendVerification(c echo.Context) error {
	var req ResendVerificationRequest
	if err := c.Bind(&req); err != nil || req.Email == "" {
		return c.JSON(http.StatusBadRequest, response.Error("email is required"))
	}
	db, tenantID := requestContext(c)

	// Stops the endpoint being used to flood someone's inbox.
	if !h.allow(c, "resend-email", normalizeEmail(req.Email), 3, time.Hour) {
		return nil
	}

	if err := h.service.ResendVerification(db, tenantID, normalizeEmail(req.Email)); err != nil {
		return writeError(c, err)
	}
	// Same answer whether or not the email exists.
	return c.JSON(http.StatusOK, response.SuccessWithMessage("If the account exists and is unverified, a new email is on its way", nil))
}

// RequestPasswordReset handles POST /api/v1/auth/forgot-password
func (h *handler) RequestPasswordReset(c echo.Context) error {
	var req PasswordResetRequest
	if err := c.Bind(&req); err != nil || req.Email == "" {
		return c.JSON(http.StatusBadRequest, response.Error("email is required"))
	}
	db, tenantID := requestContext(c)

	if !h.allow(c, "reset-email", normalizeEmail(req.Email), 3, time.Hour) {
		return nil
	}

	if err := h.service.RequestPasswordReset(db, tenantID, normalizeEmail(req.Email)); err != nil {
		return writeError(c, err)
	}
	// Same answer whether or not the email exists.
	return c.JSON(http.StatusOK, response.SuccessWithMessage("If the account exists, a password reset email is on its way", nil))
}

// ResetPassword handles POST /api/v1/auth/reset-password
func (h *handler) ResetPassword(c echo.Context) error {
	var req ResetPasswordRequest
	if err := c.Bind(&req); err != nil || req.Token == "" || req.NewPassword == "" {
		return c.JSON(http.StatusBadRequest, response.Error("token and new_password are required"))
	}
	db, _ := requestContext(c)

	if err := h.service.ResetPassword(db, req.Token, req.NewPassword); err != nil {
		return writeError(c, err)
	}
	return c.JSON(http.StatusOK, response.SuccessWithMessage("Password reset successfully", nil))
}

// writeError maps service errors to HTTP responses. Each known error has a stable "code" the
// frontend can switch on; anything unexpected becomes a 500 with no internal detail.
func writeError(c echo.Context, err error) error {
	status, code, message := http.StatusInternalServerError, "internal_error", "Something went wrong"

	switch {
	case errors.Is(err, ErrInvalidCredentials):
		status, code, message = http.StatusUnauthorized, "invalid_credentials", "Invalid email or password"
	case errors.Is(err, ErrAccountInactive):
		status, code, message = http.StatusForbidden, "account_inactive", "This account is inactive"
	case errors.Is(err, ErrEmailNotVerified):
		status, code, message = http.StatusForbidden, "email_not_verified", "Please verify your email address first"
	case errors.Is(err, ErrEmailTaken):
		status, code, message = http.StatusConflict, "email_taken", "An account with this email already exists"
	case errors.Is(err, ErrInvalidEmail):
		status, code, message = http.StatusBadRequest, "invalid_email", err.Error()
	case errors.Is(err, ErrWeakPassword):
		status, code, message = http.StatusBadRequest, "weak_password", err.Error()
	case errors.Is(err, ErrInvalidToken):
		status, code, message = http.StatusUnauthorized, "invalid_token", "This link or token is invalid or has expired"
	default:
		c.Logger().Errorf("auth: unexpected error on %s %s: %v", c.Request().Method, c.Request().URL.Path, err)
	}

	return c.JSON(status, response.ErrorWithData(message, map[string]string{"code": code}))
}
