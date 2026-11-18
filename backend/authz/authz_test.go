package authz

import (
	"reflect"
	"testing"

	"backend/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestCanGrantStopsEscalation(t *testing.T) {
	admin := &models.User{RoleSlug: "custom_role"}
	perms := map[string]bool{"roles.update": true, "users.read": true}

	if !CanGrant(admin, perms, []string{"users.read"}) {
		t.Error("should be able to grant a permission they hold")
	}
	if CanGrant(admin, perms, []string{"users.read", "election.open.create"}) {
		t.Error("must not grant a permission they do not hold")
	}
	if !CanGrant(admin, perms, nil) {
		t.Error("granting nothing is always allowed")
	}

	super := &models.User{RoleSlug: models.RoleSuperAdmin}
	if !CanGrant(super, map[string]bool{}, []string{"election.open.create"}) {
		t.Error("super admin may grant anything")
	}
}

func TestHasAnyAndSorted(t *testing.T) {
	perms := map[string]bool{"b.two": true, "a.one": true}

	if !HasAny(perms, "x.none", "a.one") {
		t.Error("expected a match on a.one")
	}
	if HasAny(perms, "x.none") || HasAny(perms) {
		t.Error("unexpected match")
	}
	if got := Sorted(perms); !reflect.DeepEqual(got, []string{"a.one", "b.two"}) {
		t.Errorf("Sorted = %v", got)
	}
}

func TestScopeRegistryFailsClosedWhenUnregistered(t *testing.T) {
	if _, ok := LookupScope("no-such-scope"); ok {
		t.Fatal("unregistered scope must not resolve")
	}

	called := false
	RegisterScope("test-scope", func(_ *gorm.DB, _, _ uuid.UUID) (bool, error) {
		called = true
		return true, nil
	})
	check, ok := LookupScope("test-scope")
	if !ok {
		t.Fatal("registered scope not found")
	}
	if allowed, err := check(nil, uuid.New(), uuid.New()); !allowed || err != nil || !called {
		t.Fatalf("checker not invoked correctly: allowed=%v err=%v called=%v", allowed, err, called)
	}
}
