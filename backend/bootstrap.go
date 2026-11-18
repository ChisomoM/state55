package main

import (
	"errors"
	"time"

	"backend/models"
	"backend/modules/auth"
	config "backend/pkg"
	"backend/pkg/validate"

	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// bootstrapAdmin creates the first super admin from BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD,
// but only while no super admin exists. Without it nobody could ever sign in to the admin console,
// because admins cannot register themselves.
//
// The account's email counts as verified, so it can sign in straight away.
func bootstrapAdmin(db *gorm.DB, cfg *config.Config, logger *zap.SugaredLogger) error {
	if cfg.BootstrapAdminEmail == "" || cfg.BootstrapAdminPassword == "" {
		return nil
	}
	if !validate.Email(cfg.BootstrapAdminEmail) {
		return errors.New("BOOTSTRAP_ADMIN_EMAIL is not a valid email address")
	}
	if !validate.Password(cfg.BootstrapAdminPassword) {
		return errors.New("BOOTSTRAP_ADMIN_PASSWORD must be between 8 and 72 characters")
	}

	tenantID := cfg.DefaultTenantUUID()

	var existing int64
	if err := db.Model(&models.User{}).
		Where("tenant_id = ? AND role_slug = ?", tenantID, models.RoleSuperAdmin).
		Count(&existing).Error; err != nil {
		return err
	}
	if existing > 0 {
		return nil // already bootstrapped
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(cfg.BootstrapAdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	now := time.Now().UTC()

	err = db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		err := tx.Where("tenant_id = ? AND email = ?", tenantID, cfg.BootstrapAdminEmail).First(&user).Error
		switch {
		case err == nil:
			// The address already has an account: promote it (its password is left alone).
			if err := tx.Model(&user).Updates(map[string]interface{}{
				"role_slug":         models.RoleSuperAdmin,
				"is_active":         true,
				"email_verified_at": now,
			}).Error; err != nil {
				return err
			}
		case errors.Is(err, gorm.ErrRecordNotFound):
			user = models.User{
				TenantBaseModel: models.TenantBaseModel{TenantID: tenantID},
				Email:           cfg.BootstrapAdminEmail,
				PasswordHash:    string(hash),
				FirstName:       "Super",
				LastName:        "Admin",
				RoleSlug:        models.RoleSuperAdmin,
				IsActive:        true,
				EmailVerifiedAt: &now,
			}
			if err := tx.Create(&user).Error; err != nil {
				return err
			}
		default:
			return err
		}
		return auth.AssignMemberID(tx, user.ID)
	})
	if err != nil {
		return err
	}

	logger.Warnf("Created first super admin %s. Sign in, then remove BOOTSTRAP_ADMIN_PASSWORD from the environment.", cfg.BootstrapAdminEmail)
	return nil
}
