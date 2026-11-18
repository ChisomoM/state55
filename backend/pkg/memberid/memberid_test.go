package memberid

import (
	"strings"
	"testing"
)

func TestGenerateIsValidAndUnique(t *testing.T) {
	seen := map[string]bool{}
	for i := 0; i < 1000; i++ {
		id, err := Generate()
		if err != nil {
			t.Fatal(err)
		}
		if err := Validate(id); err != nil {
			t.Fatalf("generated ID %q failed validation: %v", id, err)
		}
		if seen[id] {
			t.Fatalf("duplicate ID generated: %q", id)
		}
		seen[id] = true
	}
}

func TestValidateRejectsMistypedID(t *testing.T) {
	id, _ := Generate()

	// Change one character in the random part to a different valid symbol.
	b := []byte(id)
	pos := strings.Index(id, "-") + 1
	if b[pos] == 'A' {
		b[pos] = 'B'
	} else {
		b[pos] = 'A'
	}
	if err := Validate(string(b)); err == nil {
		t.Fatalf("expected %q to fail validation", b)
	}
}

func TestValidateRejectsMalformed(t *testing.T) {
	for _, id := range []string{"", "S55-", "XYZ-ABCDE-FGHJK-M", "S55-ABCDE-FGHJK", "S55-ABCDE-FGHJK-MM", "S55-ABCDE-FGHJI-M"} {
		if err := Validate(id); err == nil {
			t.Errorf("expected %q to be invalid", id)
		}
	}
}
