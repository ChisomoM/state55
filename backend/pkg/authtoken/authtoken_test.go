package authtoken

import (
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const secret = "test-secret"

func sign(t *testing.T, typ string, exp time.Duration) string {
	t.Helper()
	tok, err := Sign(secret, jwt.MapClaims{"typ": typ, "sub": "u1", "exp": time.Now().Add(exp).Unix()})
	if err != nil {
		t.Fatal(err)
	}
	return tok
}

func TestParseAcceptsAllowedType(t *testing.T) {
	claims, err := Parse(secret, sign(t, TypeAccess, time.Minute), TypeAccess)
	if err != nil {
		t.Fatal(err)
	}
	if claims["sub"] != "u1" {
		t.Fatalf("unexpected claims: %v", claims)
	}
}

func TestParseRejectsOtherTypes(t *testing.T) {
	for _, typ := range []string{TypeRefresh, ""} {
		_, err := Parse(secret, sign(t, typ, time.Minute), TypeAccess)
		if !errors.Is(err, ErrWrongType) {
			t.Errorf("type %q accepted as access token (err=%v)", typ, err)
		}
	}
}

func TestParseRejectsExpired(t *testing.T) {
	if _, err := Parse(secret, sign(t, TypeAccess, -time.Minute), TypeAccess); err == nil {
		t.Fatal("expired token accepted")
	}
}

func TestParseRejectsMissingExpiry(t *testing.T) {
	tok, _ := Sign(secret, jwt.MapClaims{"typ": TypeAccess, "sub": "u1"})
	if _, err := Parse(secret, tok, TypeAccess); err == nil {
		t.Fatal("token without exp accepted")
	}
}

func TestParseRejectsWrongSecretAndNoneAlg(t *testing.T) {
	if _, err := Parse("other-secret", sign(t, TypeAccess, time.Minute), TypeAccess); err == nil {
		t.Fatal("token signed with a different secret accepted")
	}

	none := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{"typ": TypeAccess, "exp": time.Now().Add(time.Minute).Unix()})
	s, _ := none.SignedString(jwt.UnsafeAllowNoneSignatureType)
	if _, err := Parse(secret, s, TypeAccess); err == nil {
		t.Fatal("unsigned (alg=none) token accepted")
	}
}
