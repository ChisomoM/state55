package auth

// public.go is the module's contract with the rest of the codebase: what other modules may call.
//
//	AssignMemberID(tx, userID)             give a user their public member ID
//	QueueInvite(tx, cfg, user)             email an invitation with a set-password link
//
// Everything else in this package is internal.

import (
	"time"

	appmail "backend/infra/mail"
	"backend/models"
	config "backend/pkg"
	"backend/pkg/auditlog"

	"gorm.io/gorm"
)

var (
	_ Service = (*service)(nil)
	_ Handler = (*handler)(nil)
)

const inviteTTL = 7 * 24 * time.Hour

// QueueInvite emails an invited user a link to set their password (the same single-use token flow
// as a password reset). Using the link also verifies their email address. Call inside the
// transaction that creates the user.
func QueueInvite(tx *gorm.DB, cfg *config.Config, user *models.User) error {
	raw, err := createAuthToken(tx, user, models.AuthTokenResetPassword, inviteTTL)
	if err != nil {
		return err
	}

	return appmail.EnqueueTemplate(tx, mailMeta(user), user.Email, "invite", map[string]interface{}{
		"Name":      user.FirstName,
		"Link":      linkFor(cfg, "/reset-password", raw),
		"ExpiresIn": "7 days",
	})
}

// mailMeta describes an account email (always sent; cannot be opted out of).
func mailMeta(user *models.User) appmail.Meta {
	id := user.ID
	return appmail.Meta{TenantID: user.TenantID, UserID: &id, Category: models.NotifAccount}
}

// audit records an authentication event. A failure to write the row is logged, never returned.
func (s *service) audit(db *gorm.DB, user *models.User, action, details string) {
	if err := auditlog.Record(db, user.TenantID, user.ID, action, "auth", user.ID.String(), details); err != nil {
		s.app.Logger.Warnf("audit %s for user %s failed: %v", action, user.ID, err)
	}
}
