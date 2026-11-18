package rbac

import (
	"errors"
	"regexp"
	"sort"
	"strings"

	"backend/authz"
	"backend/global"
	"backend/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var slugPattern = regexp.MustCompile(`^[a-z][a-z0-9_]{1,39}$`)

// Service defines role and permission management. db is tenant-scoped; callerID is the signed-in
// user, used to stop people granting permissions they do not hold.
type Service interface {
	ListPermissions(db *gorm.DB) ([]PermissionDTO, error)
	ListRoles(db *gorm.DB) ([]RoleDTO, error)
	CreateRole(db *gorm.DB, tenantID, callerID uuid.UUID, req CreateRoleRequest) (*RoleDTO, error)
	UpdateRole(db *gorm.DB, callerID, roleID uuid.UUID, req UpdateRoleRequest) (*RoleDTO, error)
	DeleteRole(db *gorm.DB, roleID uuid.UUID) error
}

type service struct {
	app *global.App
}

func NewService(app *global.App) Service {
	return &service{app: app}
}

func (s *service) ListPermissions(db *gorm.DB) ([]PermissionDTO, error) {
	var perms []models.Permission
	if err := db.Order("category, code").Find(&perms).Error; err != nil {
		return nil, err
	}

	out := make([]PermissionDTO, 0, len(perms))
	for _, p := range perms {
		out = append(out, PermissionDTO{ID: p.ID.String(), Code: p.Code, Category: p.Category, Description: p.Description})
	}
	return out, nil
}

func (s *service) ListRoles(db *gorm.DB) ([]RoleDTO, error) {
	var roles []models.Role
	if err := db.Preload("Permissions").Order("is_system DESC, name").Find(&roles).Error; err != nil {
		return nil, err
	}

	counts, err := userCounts(db)
	if err != nil {
		return nil, err
	}

	out := make([]RoleDTO, 0, len(roles))
	for i := range roles {
		out = append(out, toDTO(&roles[i], counts[roles[i].Slug]))
	}
	return out, nil
}

func (s *service) CreateRole(db *gorm.DB, tenantID, callerID uuid.UUID, req CreateRoleRequest) (*RoleDTO, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" || len(name) > 100 {
		return nil, ErrInvalidName
	}

	slug := strings.TrimSpace(req.Slug)
	if slug == "" {
		slug = slugify(name)
	}
	if !slugPattern.MatchString(slug) {
		return nil, ErrInvalidSlug
	}

	var taken int64
	if err := db.Model(&models.Role{}).Where("slug = ?", slug).Count(&taken).Error; err != nil {
		return nil, err
	}
	if taken > 0 {
		return nil, ErrSlugTaken
	}

	perms, codes, err := resolvePermissions(db, req.Permissions)
	if err != nil {
		return nil, err
	}
	if err := checkCanGrant(db, callerID, codes); err != nil {
		return nil, err
	}

	role := models.Role{
		TenantID:    tenantID,
		Name:        name,
		Slug:        slug,
		Description: strings.TrimSpace(req.Description),
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&role).Error; err != nil {
			return err
		}
		return setPermissions(tx, &role, perms)
	})
	if err != nil {
		return nil, err
	}

	role.Permissions = perms
	dto := toDTO(&role, 0)
	return &dto, nil
}

func (s *service) UpdateRole(db *gorm.DB, callerID, roleID uuid.UUID, req UpdateRoleRequest) (*RoleDTO, error) {
	role, err := findRole(db, roleID)
	if err != nil {
		return nil, err
	}
	if role.IsSystem {
		return nil, ErrSystemRole
	}

	updates := map[string]interface{}{}
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" || len(name) > 100 {
			return nil, ErrInvalidName
		}
		updates["name"] = name
		role.Name = name
	}
	if req.Description != nil {
		desc := strings.TrimSpace(*req.Description)
		updates["description"] = desc
		role.Description = desc
	}

	var newPerms []models.Permission
	if req.Permissions != nil {
		var codes []string
		newPerms, codes, err = resolvePermissions(db, *req.Permissions)
		if err != nil {
			return nil, err
		}
		if err := checkCanGrant(db, callerID, codes); err != nil {
			return nil, err
		}
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		if len(updates) > 0 {
			if err := tx.Model(role).Updates(updates).Error; err != nil {
				return err
			}
		}
		if req.Permissions != nil {
			return setPermissions(tx, role, newPerms)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	if req.Permissions != nil {
		role.Permissions = newPerms
	}

	counts, err := userCounts(db)
	if err != nil {
		return nil, err
	}
	dto := toDTO(role, counts[role.Slug])
	return &dto, nil
}

func (s *service) DeleteRole(db *gorm.DB, roleID uuid.UUID) error {
	role, err := findRole(db, roleID)
	if err != nil {
		return err
	}
	if role.IsSystem {
		return ErrSystemRole
	}

	var holders int64
	if err := db.Model(&models.User{}).Where("role_slug = ?", role.Slug).Count(&holders).Error; err != nil {
		return err
	}
	if holders > 0 {
		return ErrRoleInUse
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(role).Association("Permissions").Clear(); err != nil {
			return err
		}
		// Hard delete: a soft-deleted row would keep its slug reserved by the unique index.
		return tx.Unscoped().Delete(role).Error
	})
}

// ---------------------------------------------------------------------------------------------

func findRole(db *gorm.DB, id uuid.UUID) (*models.Role, error) {
	var role models.Role
	if err := db.Preload("Permissions").First(&role, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &role, nil
}

// setPermissions makes perms the role's complete permission set.
func setPermissions(tx *gorm.DB, role *models.Role, perms []models.Permission) error {
	assoc := tx.Model(role).Association("Permissions")
	if len(perms) == 0 {
		return assoc.Clear()
	}
	return assoc.Replace(perms)
}

// resolvePermissions turns permission codes into rows, rejecting unknown codes. Duplicates are ignored.
func resolvePermissions(db *gorm.DB, codes []string) ([]models.Permission, []string, error) {
	seen := map[string]bool{}
	unique := make([]string, 0, len(codes))
	for _, c := range codes {
		if c = strings.TrimSpace(c); c != "" && !seen[c] {
			seen[c] = true
			unique = append(unique, c)
		}
	}
	if len(unique) == 0 {
		return nil, nil, nil
	}

	var perms []models.Permission
	if err := db.Where("code IN ?", unique).Find(&perms).Error; err != nil {
		return nil, nil, err
	}
	if len(perms) != len(unique) {
		return nil, nil, ErrUnknownPerm
	}
	sort.Strings(unique)
	return perms, unique, nil
}

// checkCanGrant stops a caller from creating or editing a role that holds permissions they lack,
// which would otherwise let anyone with "roles.update" escalate to full admin.
func checkCanGrant(db *gorm.DB, callerID uuid.UUID, codes []string) error {
	caller, perms, err := authz.LoadPermissions(db, callerID)
	if err != nil {
		return err
	}
	if !authz.CanGrant(caller, perms, codes) {
		return ErrCannotGrant
	}
	return nil
}

func userCounts(db *gorm.DB) (map[string]int64, error) {
	var rows []struct {
		RoleSlug string
		N        int64
	}
	if err := db.Model(&models.User{}).Select("role_slug, count(*) AS n").Group("role_slug").Scan(&rows).Error; err != nil {
		return nil, err
	}
	out := make(map[string]int64, len(rows))
	for _, r := range rows {
		out[r.RoleSlug] = r.N
	}
	return out, nil
}

func toDTO(r *models.Role, users int64) RoleDTO {
	codes := make([]string, 0, len(r.Permissions))
	for _, p := range r.Permissions {
		codes = append(codes, p.Code)
	}
	sort.Strings(codes)
	return RoleDTO{
		ID: r.ID.String(), Name: r.Name, Slug: r.Slug, Description: r.Description,
		IsSystem: r.IsSystem, Permissions: codes, UserCount: users,
	}
}

// slugify turns "Election Officer" into "election_officer".
func slugify(name string) string {
	var b strings.Builder
	lastUnderscore := true
	for _, r := range strings.ToLower(name) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			lastUnderscore = false
		case !lastUnderscore:
			b.WriteByte('_')
			lastUnderscore = true
		}
	}
	return strings.Trim(b.String(), "_")
}
