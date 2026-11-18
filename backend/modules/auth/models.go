package auth

// LoginRequest is the request body for login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse is returned by login and token refresh: a full session.
type LoginResponse struct {
	AccessToken  string   `json:"access_token"`
	RefreshToken string   `json:"refresh_token"`
	User         *UserDTO `json:"user,omitempty"`
}

// UserDTO is a DTO for user data.
type UserDTO struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	RoleSlug      string `json:"role_slug"`
	EmailVerified bool   `json:"email_verified"`
	MemberID      string `json:"member_id,omitempty"` // Public member ID, assigned when the email is verified
}

// RegisterRequest is the request body for registration.
type RegisterRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// RegisterResponse is returned by registration. No tokens are issued until the email is verified.
type RegisterResponse struct {
	User             UserDTO `json:"user"`
	VerificationSent bool    `json:"verification_sent"`
}

// RefreshTokenRequest is the request body for token refresh.
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// PasswordResetRequest is the request body for password reset request.
type PasswordResetRequest struct {
	Email string `json:"email"`
}

// ResetPasswordRequest is the request body for password reset.
type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

// VerifyEmailRequest is the request body for email verification.
type VerifyEmailRequest struct {
	Token string `json:"token"`
}

// ResendVerificationRequest is the request body for resending the verification email.
type ResendVerificationRequest struct {
	Email string `json:"email"`
}
