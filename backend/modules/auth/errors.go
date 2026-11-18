package auth

import "errors"

// Errors returned by the service. The handler maps these to HTTP status codes and stable error
// codes the frontend can switch on. Anything else is treated as an internal error.
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountInactive    = errors.New("account is inactive")
	ErrEmailNotVerified   = errors.New("email not verified")
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidEmail       = errors.New("invalid email address")
	ErrWeakPassword       = errors.New("password must be between 8 and 72 characters")
	ErrInvalidToken       = errors.New("invalid or expired token")
)
