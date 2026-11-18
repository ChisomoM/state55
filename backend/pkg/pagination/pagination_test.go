package pagination

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func ctxWithQuery(q string) echo.Context {
	e := echo.New()
	return e.NewContext(httptest.NewRequest(http.MethodGet, "/?"+q, nil), httptest.NewRecorder())
}

func TestFromQuery(t *testing.T) {
	cases := []struct {
		query               string
		page, limit, offset int
	}{
		{"", 1, 20, 0},
		{"page=3&limit=10", 3, 10, 20},
		{"page=0&limit=0", 1, 20, 0},
		{"page=-4&limit=-1", 1, 20, 0},
		{"limit=5000", 1, 100, 0}, // capped
		{"page=abc&limit=xyz", 1, 20, 0},
	}
	for _, c := range cases {
		p := FromQuery(ctxWithQuery(c.query))
		if p.Page != c.page || p.Limit != c.limit || p.Offset != c.offset {
			t.Errorf("%q => %+v, want page=%d limit=%d offset=%d", c.query, p, c.page, c.limit, c.offset)
		}
	}
}

func TestNewPageSerializesEmptyListAsArray(t *testing.T) {
	b, _ := json.Marshal(NewPage[string](nil, 0, Params{Page: 1, Limit: 20}))
	if string(b) != `{"items":[],"total":0,"page":1,"limit":20}` {
		t.Fatalf("unexpected JSON: %s", b)
	}
}
