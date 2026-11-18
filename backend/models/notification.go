package models

import (
	"time"

	"github.com/google/uuid"
)

// Notification categories. "account" is mandatory: security and account emails (verification,
// password reset, invitations) are always sent and cannot be switched off.
const (
	NotifAccount    = "account"
	NotifMembership = "membership"
	NotifCommunity  = "community"
	NotifGovernance = "governance"
	NotifEvents     = "events"
)

// NotificationCategory describes a category for the preferences screen.
type NotificationCategory struct {
	Key         string
	Label       string
	Description string
	Mandatory   bool
}

// NotificationCategories is the list shown to members, in display order.
var NotificationCategories = []NotificationCategory{
	{NotifAccount, "Account and security", "Verification, password resets and sign-in alerts. Always sent.", true},
	{NotifMembership, "Membership", "Your application, card and renewal notices.", false},
	{NotifCommunity, "Communities", "Activity in the communities you belong to.", false},
	{NotifGovernance, "Elections and governance", "Nominations, voting windows and results.", false},
	{NotifEvents, "Events", "Reminders for events you registered for.", false},
}

// Email delivery states.
const (
	EmailQueued  = "queued"
	EmailSent    = "sent"
	EmailFailed  = "failed"  // Last attempt failed; the queue retries automatically.
	EmailSkipped = "skipped" // Not sent: the member opted out of this category, or SKIP_EMAILS is on.
)

// NotificationPreference is a member's email setting for one category.
// A missing row means "enabled".
type NotificationPreference struct {
	BaseModel
	TenantID     uuid.UUID `json:"tenant_id" gorm:"type:uuid;index;not null"`
	UserID       uuid.UUID `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_pref_user_category"`
	Category     string    `json:"category" gorm:"not null;uniqueIndex:idx_pref_user_category"`
	EmailEnabled bool      `json:"email_enabled"`
}

// EmailLog records every email the platform tries to send (for support and auditing).
type EmailLog struct {
	TenantBaseModel
	UserID   *uuid.UUID `json:"user_id,omitempty" gorm:"type:uuid;index"`
	ToEmail  string     `json:"to_email" gorm:"index;not null"`
	Template string     `json:"template" gorm:"index"`
	Category string     `json:"category" gorm:"index"`
	Subject  string     `json:"subject"`
	Status   string     `json:"status" gorm:"index;not null"`
	Error    string     `json:"error,omitempty" gorm:"type:text"`
	Attempts int        `json:"attempts"`
	SentAt   *time.Time `json:"sent_at,omitempty"`
}
