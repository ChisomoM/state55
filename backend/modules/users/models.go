package users

import (
	"errors"
	"time"
)

// UserDTO is the admin/self view of a user.
type UserDTO struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	FirstName     string    `json:"first_name"`
	LastName      string    `json:"last_name"`
	RoleSlug      string    `json:"role_slug"`
	IsActive      bool      `json:"is_active"`
	EmailVerified bool      `json:"email_verified"`
	MemberID      string    `json:"member_id,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// MeDTO is the signed-in user's profile plus everything they are allowed to do. The frontend uses
// the permission list to decide which screens to show; the backend enforces access regardless.
type MeDTO struct {
	UserDTO
	Permissions []string `json:"permissions"`
}

// ListQuery filters the user list.
type ListQuery struct {
	Search string // matches email, first name or last name
	Role   string // role slug
	Status string // "active" | "inactive" | ""
}

// CreateUserRequest invites a new user. They receive an email to set their password.
type CreateUserRequest struct {
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	RoleSlug  string `json:"role_slug"` // defaults to "user"
}

// UpdateUserRequest edits a user. Omitted fields are left unchanged.
type UpdateUserRequest struct {
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	RoleSlug  *string `json:"role_slug"`
	IsActive  *bool   `json:"is_active"`
}

// UpdateMeRequest edits the signed-in user's own profile.
type UpdateMeRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// ChangePasswordRequest changes the signed-in user's own password.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// Errors returned by the service; the handler maps them to HTTP responses.
var (
	ErrNotFound        = errors.New("user not found")
	ErrInvalidEmail    = errors.New("invalid email address")
	ErrInvalidName     = errors.New("names must be 100 characters or fewer")
	ErrEmailTaken      = errors.New("a user with this email already exists")
	ErrRoleNotFound    = errors.New("role not found")
	ErrCannotGrantRole = errors.New("you cannot assign a role with permissions you do not hold yourself")
	ErrSuperAdminOnly  = errors.New("only a super admin can manage super admins")
	ErrSelfChange      = errors.New("you cannot change your own role or deactivate your own account")
	ErrSelfDelete      = errors.New("you cannot delete your own account")
	ErrWrongPassword   = errors.New("current password is incorrect")
	ErrWeakPassword    = errors.New("password must be between 8 and 72 characters")
)
