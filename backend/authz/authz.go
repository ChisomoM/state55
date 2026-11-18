// Package authz answers "what is this user allowed to do?".
//
// Permissions come from the user's role plus per-user overrides, and are read from the database on
// every check, so a role change or deactivation takes effect immediately rather than when the
// user's token expires. super_admin holds every permission in the catalogue.
//
// Two kinds of checks exist:
//   - global permissions ("users.update"): LoadPermissions + Has, or middleware.RBACMiddleware;
//   - scoped checks ("is this person an admin of THIS organization?"): modules register a
//     ScopeChecker, and routes use middleware.ScopeMiddleware.
package authz

import (
	"errors"
	"sort"
	"sync"

	"backend/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LoadPermissions loads the user and the full set of permission codes they hold.
// db should be tenant-scoped.
func LoadPermissions(db *gorm.DB, userID uuid.UUID) (*models.User, map[string]bool, error) {
	var user models.User
	if err := db.Preload("PermissionOverrides.Permission").First(&user, "id = ?", userID).Error; err != nil {
		return nil, nil, err
	}

	perms := map[string]bool{}

	if user.RoleSlug == models.RoleSuperAdmin {
		for _, d := range models.DefaultPermissions {
			perms[d.Code] = true
		}
		return &user, perms, nil
	}

	var role models.Role
	err := db.Preload("Permissions").Where("slug = ?", user.RoleSlug).First(&role).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, err
	}
	for _, p := range role.Permissions {
		perms[p.Code] = true
	}

	// Overrides grant or revoke individual permissions on top of the role.
	for _, o := range user.PermissionOverrides {
		if o.Permission == nil {
			continue
		}
		if o.Granted {
			perms[o.Permission.Code] = true
		} else {
			delete(perms, o.Permission.Code)
		}
	}

	return &user, perms, nil
}

// HasAny reports whether perms contains at least one of codes.
func HasAny(perms map[string]bool, codes ...string) bool {
	for _, c := range codes {
		if perms[c] {
			return true
		}
	}
	return false
}

// Sorted returns the permission codes in alphabetical order.
func Sorted(perms map[string]bool) []string {
	out := make([]string, 0, len(perms))
	for code := range perms {
		out = append(out, code)
	}
	sort.Strings(out)
	return out
}

// CanGrant reports whether a caller may hand out the given permission codes (by creating a role,
// editing one, or assigning one). Callers can only grant what they hold themselves, so holding
// "roles.update" is not a way to become an all-powerful admin. super_admin may grant anything.
func CanGrant(caller *models.User, callerPerms map[string]bool, codes []string) bool {
	if caller.RoleSlug == models.RoleSuperAdmin {
		return true
	}
	for _, c := range codes {
		if !callerPerms[c] {
			return false
		}
	}
	return true
}

// ---------------------------------------------------------------------------------------------
// Scoped checks
// ---------------------------------------------------------------------------------------------

// ScopeChecker decides whether userID has authority over one specific resource, for example
// "is an admin of organization X" or "moderates community Y". db is tenant-scoped.
type ScopeChecker func(db *gorm.DB, userID, resourceID uuid.UUID) (bool, error)

var (
	scopesMu sync.RWMutex
	scopes   = map[string]ScopeChecker{}
)

// RegisterScope registers the checker for a named scope. Modules call it at startup, e.g.
//
//	authz.RegisterScope("organization", organizations.IsAdmin)
func RegisterScope(name string, checker ScopeChecker) {
	scopesMu.Lock()
	defer scopesMu.Unlock()
	scopes[name] = checker
}

// LookupScope returns the checker for a scope, or false if none is registered.
func LookupScope(name string) (ScopeChecker, bool) {
	scopesMu.RLock()
	defer scopesMu.RUnlock()
	c, ok := scopes[name]
	return c, ok
}
