package users

import (
	"crypto/rand"
	"errors"
	"fmt"
	"strings"

	"backend/authz"
	"backend/global"
	"backend/models"
	"backend/modules/auth"
	"backend/pkg/auditlog"
	"backend/pkg/pagination"
	"backend/pkg/validate"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Service defines user management operations. db is tenant-scoped; callerID is the signed-in user.
type Service interface {
	Me(db *gorm.DB, callerID uuid.UUID) (*MeDTO, error)
	UpdateMe(db *gorm.DB, callerID uuid.UUID, req UpdateMeRequest) (*MeDTO, error)
	ChangePassword(db *gorm.DB, callerID uuid.UUID, req ChangePasswordRequest) error

	List(db *gorm.DB, p pagination.Params, q ListQuery) (*pagination.Page[UserDTO], error)
	Get(db *gorm.DB, id uuid.UUID) (*UserDTO, error)
	Create(db *gorm.DB, tenantID, callerID uuid.UUID, req CreateUserRequest) (*UserDTO, error)
	Update(db *gorm.DB, callerID, id uuid.UUID, req UpdateUserRequest) (*UserDTO, error)
	Delete(db *gorm.DB, callerID, id uuid.UUID) error
}

type service struct {
	app *global.App
}

func NewService(app *global.App) Service {
	return &service{app: app}
}

// unscoped drops the request's tenant filter on tables that are keyed by user ID anyway.
func unscoped(db *gorm.DB) *gorm.DB { return db.Session(&gorm.Session{NewDB: true}) }

// ---------------------------------------------------------------------------------------------
// Self-service
// ---------------------------------------------------------------------------------------------

func (s *service) Me(db *gorm.DB, callerID uuid.UUID) (*MeDTO, error) {
	user, perms, err := authz.LoadPermissions(db, callerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if !user.IsActive {
		return nil, ErrNotFound
	}

	dtos, err := s.toDTOs(db, []models.User{*user})
	if err != nil {
		return nil, err
	}
	return &MeDTO{UserDTO: dtos[0], Permissions: authz.Sorted(perms)}, nil
}

func (s *service) UpdateMe(db *gorm.DB, callerID uuid.UUID, req UpdateMeRequest) (*MeDTO, error) {
	first, last := strings.TrimSpace(req.FirstName), strings.TrimSpace(req.LastName)
	if len(first) > 100 || len(last) > 100 {
		return nil, ErrInvalidName
	}

	res := db.Model(&models.User{}).Where("id = ?", callerID).
		Updates(map[string]interface{}{"first_name": first, "last_name": last})
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected == 0 {
		return nil, ErrNotFound
	}
	return s.Me(db, callerID)
}

func (s *service) ChangePassword(db *gorm.DB, callerID uuid.UUID, req ChangePasswordRequest) error {
	var user models.User
	if err := db.First(&user, "id = ?", callerID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		return ErrWrongPassword
	}
	if !validate.Password(req.NewPassword) {
		return ErrWeakPassword
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	if err := db.Model(&user).Update("password_hash", string(hash)).Error; err != nil {
		return err
	}

	s.audit(db, &user, "PASSWORD_CHANGED", "password changed from account settings")
	return nil
}

// ---------------------------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------------------------

func (s *service) List(db *gorm.DB, p pagination.Params, q ListQuery) (*pagination.Page[UserDTO], error) {
	base := db.Model(&models.User{})

	if term := strings.TrimSpace(q.Search); term != "" {
		like := "%" + escapeLike(strings.ToLower(term)) + "%"
		base = base.Where(
			"(LOWER(email) LIKE ? OR LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?)", like, like, like)
	}
	if q.Role != "" {
		base = base.Where("role_slug = ?", q.Role)
	}
	switch q.Status {
	case "active":
		base = base.Where("is_active = ?", true)
	case "inactive":
		base = base.Where("is_active = ?", false)
	}

	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return nil, err
	}

	var users []models.User
	if err := base.Session(&gorm.Session{}).
		Order("created_at DESC, id").Limit(p.Limit).Offset(p.Offset).Find(&users).Error; err != nil {
		return nil, err
	}

	dtos, err := s.toDTOs(db, users)
	if err != nil {
		return nil, err
	}
	return pagination.NewPage(dtos, total, p), nil
}

func (s *service) Get(db *gorm.DB, id uuid.UUID) (*UserDTO, error) {
	user, err := findUser(db, id)
	if err != nil {
		return nil, err
	}
	dtos, err := s.toDTOs(db, []models.User{*user})
	if err != nil {
		return nil, err
	}
	return &dtos[0], nil
}

// Create invites a user: the account is created inactive-until-activated in the sense that nobody
// knows its password; the emailed link lets the person set one (which also verifies their email).
func (s *service) Create(db *gorm.DB, tenantID, callerID uuid.UUID, req CreateUserRequest) (*UserDTO, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if !validate.Email(email) {
		return nil, ErrInvalidEmail
	}
	first, last := strings.TrimSpace(req.FirstName), strings.TrimSpace(req.LastName)
	if len(first) > 100 || len(last) > 100 {
		return nil, ErrInvalidName
	}

	roleSlug := strings.TrimSpace(req.RoleSlug)
	if roleSlug == "" {
		roleSlug = models.RoleUser
	}
	if _, err := s.checkRoleAssignable(db, callerID, roleSlug); err != nil {
		return nil, err
	}

	var existing int64
	if err := db.Model(&models.User{}).Where("email = ?", email).Count(&existing).Error; err != nil {
		return nil, err
	}
	if existing > 0 {
		return nil, ErrEmailTaken
	}

	// Nobody knows this password; the invitation link replaces it.
	randomPassword := make([]byte, 32)
	if _, err := rand.Read(randomPassword); err != nil {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword(randomPassword, bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := models.User{
		TenantBaseModel: models.TenantBaseModel{TenantID: tenantID},
		Email:           email,
		PasswordHash:    string(hash),
		FirstName:       first,
		LastName:        last,
		RoleSlug:        roleSlug,
		IsActive:        true,
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		return auth.QueueInvite(tx, s.app.Config, &user)
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrEmailTaken
		}
		return nil, err
	}

	s.auditBy(db, callerID, tenantID, "USER_INVITED", user.ID, fmt.Sprintf("invited %s as %s", email, roleSlug))
	return s.Get(db, user.ID)
}

func (s *service) Update(db *gorm.DB, callerID, id uuid.UUID, req UpdateUserRequest) (*UserDTO, error) {
	target, err := findUser(db, id)
	if err != nil {
		return nil, err
	}

	caller, perms, err := authz.LoadPermissions(db, callerID)
	if err != nil {
		return nil, err
	}
	callerIsSuper := caller.RoleSlug == models.RoleSuperAdmin

	// Only a super admin may touch a super admin.
	if target.RoleSlug == models.RoleSuperAdmin && !callerIsSuper {
		return nil, ErrSuperAdminOnly
	}

	roleChanging := req.RoleSlug != nil && *req.RoleSlug != target.RoleSlug
	deactivating := req.IsActive != nil && !*req.IsActive
	if target.ID == callerID && (roleChanging || deactivating) {
		return nil, ErrSelfChange
	}

	updates := map[string]interface{}{}

	if req.FirstName != nil {
		v := strings.TrimSpace(*req.FirstName)
		if len(v) > 100 {
			return nil, ErrInvalidName
		}
		updates["first_name"] = v
	}
	if req.LastName != nil {
		v := strings.TrimSpace(*req.LastName)
		if len(v) > 100 {
			return nil, ErrInvalidName
		}
		updates["last_name"] = v
	}
	if roleChanging {
		if _, err := s.checkRoleAssignableBy(db, caller, perms, *req.RoleSlug); err != nil {
			return nil, err
		}
		updates["role_slug"] = *req.RoleSlug
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	if len(updates) > 0 {
		if err := db.Model(target).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	if roleChanging {
		s.auditBy(db, callerID, target.TenantID, "ROLE_CHANGED", target.ID,
			fmt.Sprintf("%s: %s -> %s", target.Email, target.RoleSlug, *req.RoleSlug))
	}
	if req.IsActive != nil && *req.IsActive != target.IsActive {
		action := "USER_ACTIVATED"
		if !*req.IsActive {
			action = "USER_DEACTIVATED"
		}
		s.auditBy(db, callerID, target.TenantID, action, target.ID, target.Email)
	}

	return s.Get(db, id)
}

func (s *service) Delete(db *gorm.DB, callerID, id uuid.UUID) error {
	if id == callerID {
		return ErrSelfDelete
	}

	target, err := findUser(db, id)
	if err != nil {
		return err
	}

	caller, _, err := authz.LoadPermissions(db, callerID)
	if err != nil {
		return err
	}
	if target.RoleSlug == models.RoleSuperAdmin && caller.RoleSlug != models.RoleSuperAdmin {
		return ErrSuperAdminOnly
	}

	originalEmail := target.Email
	err = db.Transaction(func(tx *gorm.DB) error {
		// Soft delete keeps the row for audit history, but the unique email index would keep the
		// address reserved forever, so release it.
		if err := tx.Model(target).Updates(map[string]interface{}{
			"email":     fmt.Sprintf("deleted+%s@invalid", target.ID),
			"is_active": false,
		}).Error; err != nil {
			return err
		}
		return tx.Delete(target).Error
	})
	if err != nil {
		return err
	}

	s.auditBy(db, callerID, target.TenantID, "USER_DELETED", target.ID, originalEmail)
	return nil
}

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

func findUser(db *gorm.DB, id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := db.First(&user, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &user, nil
}

// checkRoleAssignable loads the caller and verifies they may give someone this role.
func (s *service) checkRoleAssignable(db *gorm.DB, callerID uuid.UUID, roleSlug string) (*models.Role, error) {
	caller, perms, err := authz.LoadPermissions(db, callerID)
	if err != nil {
		return nil, err
	}
	return s.checkRoleAssignableBy(db, caller, perms, roleSlug)
}

// checkRoleAssignableBy verifies the role exists and the caller holds every permission it carries
// (so an admin cannot hand out more power than they have). Only a super admin can assign super_admin.
func (s *service) checkRoleAssignableBy(db *gorm.DB, caller *models.User, callerPerms map[string]bool, roleSlug string) (*models.Role, error) {
	var role models.Role
	if err := db.Preload("Permissions").Where("slug = ?", roleSlug).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRoleNotFound
		}
		return nil, err
	}

	if role.Slug == models.RoleSuperAdmin && caller.RoleSlug != models.RoleSuperAdmin {
		return nil, ErrSuperAdminOnly
	}

	codes := make([]string, 0, len(role.Permissions))
	for _, p := range role.Permissions {
		codes = append(codes, p.Code)
	}
	if !authz.CanGrant(caller, callerPerms, codes) {
		return nil, ErrCannotGrantRole
	}
	return &role, nil
}

// toDTOs converts users to DTOs, looking up member IDs in one batched query.
func (s *service) toDTOs(db *gorm.DB, users []models.User) ([]UserDTO, error) {
	ids := make([]uuid.UUID, 0, len(users))
	for _, u := range users {
		ids = append(ids, u.ID)
	}

	memberIDs := map[uuid.UUID]string{}

	if len(ids) > 0 {
		var mids []models.MemberID
		if err := unscoped(db).Where("user_id IN ?", ids).Find(&mids).Error; err != nil {
			return nil, err
		}
		for _, m := range mids {
			memberIDs[m.UserID] = m.PublicID
		}
	}

	out := make([]UserDTO, 0, len(users))
	for _, u := range users {
		out = append(out, UserDTO{
			ID:            u.ID.String(),
			Email:         u.Email,
			FirstName:     u.FirstName,
			LastName:      u.LastName,
			RoleSlug:      u.RoleSlug,
			IsActive:      u.IsActive,
			EmailVerified: u.EmailVerifiedAt != nil,
			MemberID:      memberIDs[u.ID],
			CreatedAt:     u.CreatedAt,
		})
	}
	return out, nil
}

// audit records an event about the user themselves.
func (s *service) audit(db *gorm.DB, user *models.User, action, details string) {
	s.auditBy(db, user.ID, user.TenantID, action, user.ID, details)
}

// auditBy records an event done by actorID to the user targetID.
func (s *service) auditBy(db *gorm.DB, actorID, tenantID uuid.UUID, action string, targetID uuid.UUID, details string) {
	if err := auditlog.Record(db, tenantID, actorID, action, "users", targetID.String(), details); err != nil {
		s.app.Logger.Warnf("audit %s failed: %v", action, err)
	}
}

// escapeLike escapes LIKE wildcards so a search for "50%" matches the text, not everything.
func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}
