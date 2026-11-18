package models

import (
	"time"

	"github.com/google/uuid"
)

// Purposes for AuthToken.
const (
	AuthTokenVerifyEmail   = "verify_email"
	AuthTokenResetPassword = "reset_password"
)

// AuthToken is a single-use, expiring token emailed to a user (email verification, password reset).
// Only the SHA-256 hash of the token is stored, so a database leak does not expose usable tokens.
type AuthToken struct {
	TenantBaseModel
	UserID    uuid.UUID  `json:"user_id" gorm:"type:uuid;index;not null"`
	Purpose   string     `json:"purpose" gorm:"index;not null"`
	TokenHash string     `json:"-" gorm:"uniqueIndex;not null"`
	ExpiresAt time.Time  `json:"expires_at" gorm:"not null"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
}

// MemberID is the public, shareable identifier for a person (never sequential, reveals nothing
// about country or join date). The internal identifier remains the user's UUID.
type MemberID struct {
	BaseModel
	UserID   uuid.UUID `json:"user_id" gorm:"type:uuid;uniqueIndex;not null"` // one person, one ID
	PublicID string    `json:"public_id" gorm:"uniqueIndex;not null"`
}
