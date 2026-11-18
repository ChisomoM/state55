// Package auditlog writes audit records for events that do not go through the audit middleware:
// sign-ins, email verification, password changes, user and role administration.
package auditlog

import (
	"backend/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Record stores one audit entry: actorID did `action` to `resource`/`resourceID`.
// Callers should log a returned error but not fail the user's action because of it: a missing
// audit row must not undo a successful sign-in.
func Record(db *gorm.DB, tenantID, actorID uuid.UUID, action, resource, resourceID, details string) error {
	return db.Session(&gorm.Session{NewDB: true}).Create(&models.AuditLog{
		TenantBaseModel: models.TenantBaseModel{TenantID: tenantID},
		UserID:          actorID,
		Action:          action,
		Resource:        resource,
		ResourceID:      resourceID,
		Details:         details,
	}).Error
}
