// Package audit exposes the audit log to administrators (read-only).
//
// Entries are written by middleware.AuditMiddleware (every state-changing API call, with its HTTP
// status) and by pkg/auditlog (sign-ins, verification, password and role changes).
package audit

import (
	"net/http"
	"time"

	"backend/models"
	"backend/pkg/pagination"
	"backend/pkg/response"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// EntryDTO is one audit log row.
type EntryDTO struct {
	ID         string    `json:"id"`
	CreatedAt  time.Time `json:"created_at"`
	UserID     string    `json:"user_id"`
	UserEmail  string    `json:"user_email,omitempty"` // empty if the user was deleted
	Action     string    `json:"action"`
	Resource   string    `json:"resource"`
	ResourceID string    `json:"resource_id,omitempty"`
	Details    string    `json:"details,omitempty"`
	IPAddress  string    `json:"ip_address,omitempty"`
}

// Filter narrows the list. Zero values mean "no filter".
type Filter struct {
	UserID   *uuid.UUID
	Action   string
	Resource string
	From, To *time.Time
}

// Handler serves GET /api/v1/admin/audit-logs
type Handler interface {
	List(c echo.Context) error
}

type handler struct{}

func NewHandler() Handler { return &handler{} }

func (h *handler) List(c echo.Context) error {
	db := c.Get("db").(*gorm.DB)
	p := pagination.FromQuery(c)

	f, ok := parseFilter(c)
	if !ok {
		return c.JSON(http.StatusBadRequest, response.ErrorCode("invalid_filter", "Invalid filter"))
	}

	base := db.Model(&models.AuditLog{})
	if f.UserID != nil {
		base = base.Where("user_id = ?", *f.UserID)
	}
	if f.Action != "" {
		base = base.Where("action = ?", f.Action)
	}
	if f.Resource != "" {
		base = base.Where("resource = ?", f.Resource)
	}
	if f.From != nil {
		base = base.Where("created_at >= ?", *f.From)
	}
	if f.To != nil {
		base = base.Where("created_at < ?", *f.To)
	}

	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return serverError(c, err)
	}

	var rows []models.AuditLog
	if err := base.Session(&gorm.Session{}).Preload("User").
		Order("created_at DESC, id").Limit(p.Limit).Offset(p.Offset).Find(&rows).Error; err != nil {
		return serverError(c, err)
	}

	items := make([]EntryDTO, 0, len(rows))
	for _, r := range rows {
		e := EntryDTO{
			ID: r.ID.String(), CreatedAt: r.CreatedAt, UserID: r.UserID.String(),
			Action: r.Action, Resource: r.Resource, ResourceID: r.ResourceID,
			Details: r.Details, IPAddress: r.IPAddress,
		}
		if r.User != nil {
			e.UserEmail = r.User.Email
		}
		items = append(items, e)
	}

	return c.JSON(http.StatusOK, response.Success(pagination.NewPage(items, total, p)))
}

// parseFilter reads user_id, action, resource, from and to (YYYY-MM-DD, inclusive of the "to" day).
func parseFilter(c echo.Context) (Filter, bool) {
	f := Filter{Action: c.QueryParam("action"), Resource: c.QueryParam("resource")}

	if v := c.QueryParam("user_id"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			return f, false
		}
		f.UserID = &id
	}
	if v := c.QueryParam("from"); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			return f, false
		}
		f.From = &t
	}
	if v := c.QueryParam("to"); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			return f, false
		}
		end := t.AddDate(0, 0, 1) // include the whole "to" day
		f.To = &end
	}
	return f, true
}

func serverError(c echo.Context, err error) error {
	c.Logger().Errorf("audit: %v", err)
	return c.JSON(http.StatusInternalServerError, response.ErrorCode("internal_error", "Something went wrong"))
}
