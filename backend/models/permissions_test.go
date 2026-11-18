package models

import (
	"regexp"
	"testing"
)

// One to three lower-case words (underscores allowed) naming the thing, then one of four verbs:
// users.read, org.zone.create, election.open.create.
var permissionCode = regexp.MustCompile(`^[a-z][a-z_]*(\.[a-z][a-z_]*){0,2}\.(create|read|update|delete)$`)

func TestPermissionCodesFollowTheCRUDNamingRule(t *testing.T) {
	for _, d := range DefaultPermissions {
		if !permissionCode.MatchString(d.Code) {
			t.Errorf("permission %q must be module.resource[.subresource].create|read|update|delete (no manage, view, approve, open...)", d.Code)
		}
	}
}

func TestLegacyPermissionRenamesAreSound(t *testing.T) {
	current := map[string]bool{}
	for _, d := range DefaultPermissions {
		current[d.Code] = true
	}
	for old, replacements := range LegacyPermissionRenames {
		if current[old] {
			t.Errorf("legacy code %q is still in the catalogue; a retired code must not be reused", old)
		}
		if len(replacements) == 0 {
			t.Errorf("legacy code %q has no replacement", old)
		}
		for _, n := range replacements {
			if !current[n] {
				t.Errorf("legacy code %q maps to %q, which is not in the catalogue", old, n)
			}
		}
	}
}

func TestPermissionCatalogueIsConsistent(t *testing.T) {
	codes := map[string]bool{}
	for _, d := range DefaultPermissions {
		if d.Code == "" || d.Category == "" || d.Description == "" {
			t.Errorf("incomplete permission definition: %+v", d)
		}
		if codes[d.Code] {
			t.Errorf("duplicate permission code %q", d.Code)
		}
		codes[d.Code] = true
	}
}

func TestDefaultRolesAreUniqueAndCoverTheBuiltIns(t *testing.T) {
	slugs := map[string]bool{}
	for _, r := range DefaultRoles {
		if slugs[r.Slug] {
			t.Errorf("duplicate role slug %q", r.Slug)
		}
		slugs[r.Slug] = true
	}
	for _, want := range []string{RoleSuperAdmin, RoleAdmin, RoleUser} {
		if !slugs[want] {
			t.Errorf("built-in role %q missing from DefaultRoles", want)
		}
	}
}

func TestNotificationCategories(t *testing.T) {
	mandatory := 0
	seen := map[string]bool{}
	for _, c := range NotificationCategories {
		if seen[c.Key] {
			t.Errorf("duplicate category %q", c.Key)
		}
		seen[c.Key] = true
		if c.Mandatory {
			mandatory++
		}
	}
	if !seen[NotifAccount] {
		t.Error("account category missing")
	}
	for _, c := range NotificationCategories {
		if c.Key == NotifAccount && !c.Mandatory {
			t.Error("account (security) emails must not be optional")
		}
	}
	if mandatory == 0 {
		t.Error("expected at least one mandatory category")
	}
}
