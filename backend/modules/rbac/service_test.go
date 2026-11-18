package rbac

import "testing"

func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"Election Officer":    "election_officer",
		"  Regional   Lead  ": "regional_lead",
		"Ward-3 Coordinator":  "ward_3_coordinator",
		"UPPER":               "upper",
		"***":                 "",
		"Café Manager":        "caf_manager",
	}
	for in, want := range cases {
		if got := slugify(in); got != want {
			t.Errorf("slugify(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestSlugPattern(t *testing.T) {
	valid := []string{"ab", "election_officer", "a1_b2"}
	invalid := []string{"", "a", "1abc", "Has_Upper", "has-dash", "has space", "waytoolong_waytoolong_waytoolong_waytoolong"}

	for _, s := range valid {
		if !slugPattern.MatchString(s) {
			t.Errorf("%q should be a valid slug", s)
		}
	}
	for _, s := range invalid {
		if slugPattern.MatchString(s) {
			t.Errorf("%q should be rejected", s)
		}
	}
}
