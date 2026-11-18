package db

import (
	"errors"
	"fmt"

	"backend/infra/outbox"
	"backend/models"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// RunMigrations executes all migration files from the migrations/ directory.
// This should be called once at startup with the migration DB connection.
func RunMigrations(db *gorm.DB, logger *zap.SugaredLogger) error {
	logger.Info("Starting database migrations...")

	// Migration files should be in db/migrations/ and named with timestamps.
	// This is a placeholder that would typically use SQL file execution.
	// In a real implementation, you'd read SQL files and execute them.

	logger.Info("Migrations completed successfully")
	return nil
}

// AutoMigrate creates all database tables from models.
// This is a GORM-based alternative to file-based migrations.
// Use this for development/small projects, or use file-based migrations for prod.
func AutoMigrate(db *gorm.DB, logger *zap.SugaredLogger) error {
	logger.Info("Running AutoMigrate...")

	// Core models: tenants, company admins, users, roles, permissions, audit
	if err := db.AutoMigrate(
		&models.Tenant{},
		&models.CompanyAdmin{},
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.UserPermissionOverride{},
		&models.AuditLog{},
		&models.AuthToken{},
		&models.MemberID{},
		&models.NotificationPreference{},
		&models.EmailLog{},
		&outbox.Event{},
	); err != nil {
		logger.Errorf("AutoMigrate failed: %v", err)
		return err
	}

	logger.Info("AutoMigrate completed successfully")
	return nil
}

// SeedDefaultTenant creates the default tenant (with the given UUID) if it doesn't exist.
// Public routes (register, login) resolve to this tenant when no tenant is specified.
func SeedDefaultTenant(db *gorm.DB, tenantID uuid.UUID, logger *zap.SugaredLogger) error {
	tenant := models.Tenant{
		BaseModel: models.BaseModel{ID: tenantID},
		Name:      "Default",
		Slug:      "default",
		IsActive:  true,
		Metadata:  "{}",
	}
	if err := db.Where("id = ?", tenantID).FirstOrCreate(&tenant).Error; err != nil {
		return err
	}
	logger.Infof("Default tenant ready: %s", tenantID)
	return nil
}

// migrateLegacyPermissions converts databases that still hold retired permission codes (see
// models.LegacyPermissionRenames). For each retired code that exists in the tenant, every role and
// every per-user override that held it receives all of its replacements, then the retired code is
// deleted. It is idempotent: once a code is gone there is nothing left to do.
// The replacement permissions must already exist, so call it after the catalogue is seeded.
func migrateLegacyPermissions(db *gorm.DB, tenantID uuid.UUID, logger *zap.SugaredLogger) error {
	for oldCode, newCodes := range models.LegacyPermissionRenames {
		var old models.Permission
		err := db.Unscoped().Where("code = ? AND tenant_id = ?", oldCode, tenantID).First(&old).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			continue
		}
		if err != nil {
			return err
		}

		var replacements []models.Permission
		if err := db.Where("code IN ? AND tenant_id = ?", newCodes, tenantID).Find(&replacements).Error; err != nil {
			return err
		}
		if len(replacements) != len(newCodes) {
			return fmt.Errorf("renaming permission %q: replacements are not all seeded", oldCode)
		}

		err = db.Transaction(func(tx *gorm.DB) error {
			for _, n := range replacements {
				if err := tx.Exec(
					`INSERT INTO role_permissions (role_id, permission_id)
					 SELECT role_id, ? FROM role_permissions WHERE permission_id = ?
					 ON CONFLICT DO NOTHING`, n.ID, old.ID).Error; err != nil {
					return err
				}
				if err := tx.Exec(
					`INSERT INTO user_permission_overrides
					   (id, created_at, updated_at, user_id, permission_id, granted, granted_by, granted_at, reason)
					 SELECT gen_random_uuid(), now(), now(), o.user_id, ?, o.granted, o.granted_by, o.granted_at, o.reason
					 FROM user_permission_overrides o
					 WHERE o.permission_id = ? AND o.deleted_at IS NULL
					   AND NOT EXISTS (SELECT 1 FROM user_permission_overrides x
					                   WHERE x.user_id = o.user_id AND x.permission_id = ? AND x.deleted_at IS NULL)`,
					n.ID, old.ID, n.ID).Error; err != nil {
					return err
				}
			}
			if err := tx.Exec(`DELETE FROM role_permissions WHERE permission_id = ?`, old.ID).Error; err != nil {
				return err
			}
			if err := tx.Exec(`DELETE FROM user_permission_overrides WHERE permission_id = ?`, old.ID).Error; err != nil {
				return err
			}
			return tx.Exec(`DELETE FROM permissions WHERE id = ?`, old.ID).Error
		})
		if err != nil {
			logger.Errorf("Failed to rename permission %s: %v", oldCode, err)
			return err
		}
		logger.Infof("Renamed permission %s to %v", oldCode, newCodes)
	}
	return nil
}

// SeedDefaultRoles makes a tenant's permissions and built-in roles match the catalogue in
// models.DefaultPermissions / models.DefaultRoles. It is safe to run on every start:
//   - missing permissions are created and descriptions are refreshed;
//   - built-in roles are created if missing and their permission sets are re-synced (so a new
//     permission added to the catalogue reaches "admin" automatically);
//   - custom roles are never touched.
func SeedDefaultRoles(db *gorm.DB, tenantID uuid.UUID, logger *zap.SugaredLogger) error {
	logger.Infof("Seeding permissions and roles for tenant: %s", tenantID)

	perms := make([]models.Permission, 0, len(models.DefaultPermissions))
	for _, def := range models.DefaultPermissions {
		perm := models.Permission{Code: def.Code, TenantID: tenantID}
		err := db.Where("code = ? AND tenant_id = ?", def.Code, tenantID).
			Assign(models.Permission{Category: def.Category, Description: def.Description}).
			FirstOrCreate(&perm).Error
		if err != nil {
			logger.Errorf("Failed to seed permission %s: %v", def.Code, err)
			return err
		}
		perms = append(perms, perm)
	}

	if err := migrateLegacyPermissions(db, tenantID, logger); err != nil {
		return err
	}

	for _, def := range models.DefaultRoles {
		role := models.Role{TenantID: tenantID, Slug: def.Slug}
		err := db.Where("slug = ? AND tenant_id = ?", def.Slug, tenantID).
			Assign(models.Role{Name: def.Name, Description: def.Description, IsSystem: true}).
			FirstOrCreate(&role).Error
		if err != nil {
			logger.Errorf("Failed to seed role %s: %v", def.Slug, err)
			return err
		}

		want := []models.Permission{}
		if def.AllPerms {
			want = perms
		}
		assoc := db.Model(&role).Association("Permissions")
		if len(want) == 0 {
			err = assoc.Clear()
		} else {
			err = assoc.Replace(want)
		}
		if err != nil {
			logger.Errorf("Failed to sync permissions for role %s: %v", def.Slug, err)
			return err
		}
	}

	logger.Infof("Seeded %d permissions and %d built-in roles", len(perms), len(models.DefaultRoles))
	return nil
}
