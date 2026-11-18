// Package validate holds input checks shared by modules.
package validate

import "net/mail"

// Password limits. The upper bound is bcrypt's: it only reads the first 72 bytes.
const (
	MinPasswordLen = 8
	MaxPasswordLen = 72
)

// Email reports whether s is a plain address like "name@example.com" (no display name, no lists).
func Email(s string) bool {
	if len(s) > 254 {
		return false
	}
	addr, err := mail.ParseAddress(s)
	return err == nil && addr.Address == s
}

// Password reports whether p is an acceptable password length.
func Password(p string) bool {
	return len(p) >= MinPasswordLen && len(p) <= MaxPasswordLen
}
