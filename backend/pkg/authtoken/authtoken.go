// Package authtoken signs and verifies the JWTs used by the API.
//
// Every token carries a "typ" claim so one kind of token can never be used as another:
//
//	access     - authorizes API calls (short-lived)
//	refresh    - exchanged for a new access token (long-lived), rejected by the API middleware
package authtoken

import (
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// Token types (value of the "typ" claim).
const (
	TypeAccess  = "access"
	TypeRefresh = "refresh"
)

// ErrWrongType is returned when a valid token is presented where a different type is required.
var ErrWrongType = errors.New("wrong token type")

// Sign creates an HS256 token from claims.
func Sign(secret string, claims jwt.MapClaims) (string, error) {
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

// Parse verifies the signature and expiry and checks that the token's type is one of allowed.
func Parse(secret, tokenString string, allowed ...string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithExpirationRequired())
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	typ, _ := claims["typ"].(string)
	for _, a := range allowed {
		if typ == a {
			return claims, nil
		}
	}
	return nil, fmt.Errorf("%w: got %q", ErrWrongType, typ)
}
