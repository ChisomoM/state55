// Package memberid generates and validates public member IDs.
//
// Format: S55-XXXXX-XXXXX-C where X is random and C is a check character.
// The random part comes from crypto/rand, so IDs are never sequential and reveal nothing about
// country or join date. The check character catches mistyped IDs before any database lookup.
package memberid

import (
	"crypto/rand"
	"errors"
	"strings"
)

const (
	prefix = "S55"

	// Crockford base32: no I, L, O or U, so IDs are easy to read out loud and hard to misread.
	alphabet   = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
	randomLen  = 10
	groupSize  = 5
	totalChars = randomLen + 1 // random part + check character
)

// ErrInvalid is returned by Validate for malformed IDs or a failed check character.
var ErrInvalid = errors.New("invalid member ID")

// Generate returns a new random member ID.
func Generate() (string, error) {
	buf := make([]byte, randomLen)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}

	chars := make([]byte, randomLen)
	for i, b := range buf {
		chars[i] = alphabet[b&31] // 32 symbols, so masking is unbiased
	}

	body := string(chars)
	check := checkChar(body)

	return prefix + "-" + body[:groupSize] + "-" + body[groupSize:] + "-" + string(check), nil
}

// Validate reports whether id is well-formed and its check character matches.
func Validate(id string) error {
	id = strings.ToUpper(strings.TrimSpace(id))
	if !strings.HasPrefix(id, prefix+"-") {
		return ErrInvalid
	}

	compact := strings.ReplaceAll(strings.TrimPrefix(id, prefix+"-"), "-", "")
	if len(compact) != totalChars {
		return ErrInvalid
	}
	for _, r := range compact {
		if strings.IndexRune(alphabet, r) < 0 {
			return ErrInvalid
		}
	}

	body, check := compact[:randomLen], compact[randomLen]
	if checkChar(body) != check {
		return ErrInvalid
	}
	return nil
}

// checkChar computes the check character: a weighted sum of symbol values (odd weights, which are
// coprime with 32, so any single mistyped character changes the result) modulo 32.
func checkChar(body string) byte {
	sum := 0
	for i := 0; i < len(body); i++ {
		sum += strings.IndexByte(alphabet, body[i]) * (2*i + 1)
	}
	return alphabet[sum%32]
}
