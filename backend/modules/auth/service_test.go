package auth

import "testing"

func TestValidatePassword(t *testing.T) {
	cases := map[string]bool{
		"short":                  false,
		"12345678":               true,
		string(make([]byte, 72)): true,
		string(make([]byte, 73)): false,
	}
	for pw, ok := range cases {
		if err := validatePassword(pw); (err == nil) != ok {
			t.Errorf("validatePassword(len=%d) ok=%v, want %v", len(pw), err == nil, ok)
		}
	}
}

func TestValidEmail(t *testing.T) {
	for email, ok := range map[string]bool{
		"a@b.co":                true,
		"member@state55.africa": true,
		"":                      false,
		"no-at-sign":            false,
		"Name <a@b.co>":         false, // display-name form is not an address
		"a@b.co, c@d.co":        false,
	} {
		if validEmail(email) != ok {
			t.Errorf("validEmail(%q) = %v, want %v", email, !ok, ok)
		}
	}
}

func TestHashTokenIsStableAndDifferentFromInput(t *testing.T) {
	if hashToken("abc") != hashToken("abc") || hashToken("abc") == "abc" || hashToken("abc") == hashToken("abd") {
		t.Fatal("hashToken misbehaves")
	}
}
