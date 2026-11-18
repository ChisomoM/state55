// Package pagination parses ?page= and ?limit= and wraps list responses.
package pagination

import (
	"strconv"

	"github.com/labstack/echo/v4"
)

const (
	defaultLimit = 20
	maxLimit     = 100
)

// Params are the parsed paging inputs.
type Params struct {
	Page   int
	Limit  int
	Offset int
}

// FromQuery reads page (default 1) and limit (default 20, max 100) from the query string.
func FromQuery(c echo.Context) Params {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit < 1 {
		limit = defaultLimit
	}
	if limit > maxLimit {
		limit = maxLimit
	}
	return Params{Page: page, Limit: limit, Offset: (page - 1) * limit}
}

// Page is the standard list response.
type Page[T any] struct {
	Items []T   `json:"items"`
	Total int64 `json:"total"`
	Page  int   `json:"page"`
	Limit int   `json:"limit"`
}

// NewPage builds a Page, making sure Items serializes as [] rather than null.
func NewPage[T any](items []T, total int64, p Params) *Page[T] {
	if items == nil {
		items = []T{}
	}
	return &Page[T]{Items: items, Total: total, Page: p.Page, Limit: p.Limit}
}
