// Package notifications handles email notification preferences, the email delivery log, and the
// Send function other modules call to email a member.
//
// Only email is supported for now (no in-app or push).
//
// Sending from another module:
//
//	err := db.Transaction(func(tx *gorm.DB) error {
//	    // ... change data ...
//	    return notifications.Send(tx, userID, models.NotifMembership, "notification", map[string]interface{}{
//	        "Subject": "Your membership was approved", "Body": "Welcome!", "Link": url, "LinkLabel": "View card",
//	    })
//	})
//
// The email is queued in the same transaction (so it exists only if the change commits) and is
// skipped, but logged, if the member switched that category off.
package notifications

import (
	"errors"
	"net/http"
	"strings"
	"time"

	appmail "backend/infra/mail"
	"backend/models"
	"backend/pkg/pagination"
	"backend/pkg/response"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Send emails a member using a template, honouring their preferences. Categories marked mandatory
// (account/security mail) are always sent. data is passed to the template; data["Name"] defaults to
// the member's first name.
func Send(tx *gorm.DB, userID uuid.UUID, category, templateName string, data map[string]interface{}) error {
	var user models.User
	if err := tx.Session(&gorm.Session{NewDB: true}).First(&user, "id = ?", userID).Error; err != nil {
		return err
	}

	meta := appmail.Meta{TenantID: user.TenantID, UserID: &userID, Category: category}

	if data == nil {
		data = map[string]interface{}{}
	}
	if _, ok := data["Name"]; !ok {
		data["Name"] = user.FirstName
	}

	if !isMandatory(category) {
		var pref models.NotificationPreference
		err := tx.Session(&gorm.Session{NewDB: true}).
			Where("user_id = ? AND category = ?", userID, category).First(&pref).Error
		if err == nil && !pref.EmailEnabled {
			subject, _ := data["Subject"].(string)
			return appmail.LogSkipped(tx, meta, user.Email, templateName, subject)
		}
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
	}

	return appmail.EnqueueTemplate(tx, meta, user.Email, templateName, data)
}

func isMandatory(category string) bool {
	for _, c := range models.NotificationCategories {
		if c.Key == category {
			return c.Mandatory
		}
	}
	return false
}

// ---------------------------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------------------------

// PreferenceDTO is one row of the member's preferences screen.
type PreferenceDTO struct {
	Category     string `json:"category"`
	Label        string `json:"label"`
	Description  string `json:"description"`
	Mandatory    bool   `json:"mandatory"`
	EmailEnabled bool   `json:"email_enabled"`
}

// UpdatePreferencesRequest sets the email switch for some categories. Mandatory ones are ignored.
type UpdatePreferencesRequest struct {
	Preferences []struct {
		Category     string `json:"category"`
		EmailEnabled bool   `json:"email_enabled"`
	} `json:"preferences"`
}

// EmailLogDTO is one row of the admin email log.
type EmailLogDTO struct {
	ID        string     `json:"id"`
	CreatedAt time.Time  `json:"created_at"`
	ToEmail   string     `json:"to_email"`
	Template  string     `json:"template"`
	Category  string     `json:"category"`
	Subject   string     `json:"subject"`
	Status    string     `json:"status"`
	Error     string     `json:"error,omitempty"`
	Attempts  int        `json:"attempts"`
	SentAt    *time.Time `json:"sent_at,omitempty"`
}

// Handler defines the notification HTTP handlers.
type Handler interface {
	GetPreferences(c echo.Context) error
	UpdatePreferences(c echo.Context) error
	EmailLog(c echo.Context) error
}

type handler struct{}

func NewHandler() Handler { return &handler{} }

func scopedDB(c echo.Context) *gorm.DB { return c.Get("db").(*gorm.DB) }

func caller(c echo.Context) (uuid.UUID, bool) {
	s, _ := c.Get("user_id").(string)
	id, err := uuid.Parse(s)
	return id, err == nil
}

func serverError(c echo.Context, err error) error {
	c.Logger().Errorf("notifications: %v", err)
	return c.JSON(http.StatusInternalServerError, response.ErrorCode("internal_error", "Something went wrong"))
}

// GetPreferences handles GET /api/v1/notifications/preferences
func (h *handler) GetPreferences(c echo.Context) error {
	userID, ok := caller(c)
	if !ok {
		return c.JSON(http.StatusUnauthorized, response.ErrorCode("unauthorized", "Authentication required"))
	}

	out, err := loadPreferences(scopedDB(c), userID)
	if err != nil {
		return serverError(c, err)
	}
	return c.JSON(http.StatusOK, response.Success(out))
}

// UpdatePreferences handles PUT /api/v1/notifications/preferences
func (h *handler) UpdatePreferences(c echo.Context) error {
	userID, ok := caller(c)
	if !ok {
		return c.JSON(http.StatusUnauthorized, response.ErrorCode("unauthorized", "Authentication required"))
	}
	var req UpdatePreferencesRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, response.ErrorCode("invalid_request", "Invalid request"))
	}

	db := scopedDB(c)
	tenantID := c.Get("tenantID").(uuid.UUID)

	for _, p := range req.Preferences {
		if !isKnownOptional(p.Category) {
			continue // unknown or mandatory: ignore
		}
		row := models.NotificationPreference{
			TenantID: tenantID, UserID: userID, Category: p.Category, EmailEnabled: p.EmailEnabled,
		}
		err := db.Session(&gorm.Session{NewDB: true}).Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "category"}},
			DoUpdates: clause.AssignmentColumns([]string{"email_enabled", "updated_at"}),
		}).Create(&row).Error
		if err != nil {
			return serverError(c, err)
		}
	}

	out, err := loadPreferences(db, userID)
	if err != nil {
		return serverError(c, err)
	}
	return c.JSON(http.StatusOK, response.SuccessWithMessage("Preferences saved", out))
}

func isKnownOptional(category string) bool {
	for _, c := range models.NotificationCategories {
		if c.Key == category {
			return !c.Mandatory
		}
	}
	return false
}

func loadPreferences(db *gorm.DB, userID uuid.UUID) ([]PreferenceDTO, error) {
	var rows []models.NotificationPreference
	if err := db.Session(&gorm.Session{NewDB: true}).Where("user_id = ?", userID).Find(&rows).Error; err != nil {
		return nil, err
	}
	enabled := map[string]bool{}
	for _, r := range rows {
		enabled[r.Category] = r.EmailEnabled
	}

	out := make([]PreferenceDTO, 0, len(models.NotificationCategories))
	for _, cat := range models.NotificationCategories {
		on := true // no row means enabled
		if v, ok := enabled[cat.Key]; ok && !cat.Mandatory {
			on = v
		}
		out = append(out, PreferenceDTO{
			Category: cat.Key, Label: cat.Label, Description: cat.Description,
			Mandatory: cat.Mandatory, EmailEnabled: on,
		})
	}
	return out, nil
}

// EmailLog handles GET /api/v1/admin/email-log?page=&limit=&status=&q=
func (h *handler) EmailLog(c echo.Context) error {
	p := pagination.FromQuery(c)

	base := scopedDB(c).Model(&models.EmailLog{})
	if status := c.QueryParam("status"); status != "" {
		base = base.Where("status = ?", status)
	}
	if q := strings.TrimSpace(c.QueryParam("q")); q != "" {
		like := "%" + strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(strings.ToLower(q)) + "%"
		base = base.Where("(LOWER(to_email) LIKE ? OR LOWER(subject) LIKE ?)", like, like)
	}

	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return serverError(c, err)
	}

	var rows []models.EmailLog
	if err := base.Session(&gorm.Session{}).
		Order("created_at DESC, id").Limit(p.Limit).Offset(p.Offset).Find(&rows).Error; err != nil {
		return serverError(c, err)
	}

	items := make([]EmailLogDTO, 0, len(rows))
	for _, r := range rows {
		items = append(items, EmailLogDTO{
			ID: r.ID.String(), CreatedAt: r.CreatedAt, ToEmail: r.ToEmail, Template: r.Template,
			Category: r.Category, Subject: r.Subject, Status: r.Status, Error: r.Error,
			Attempts: r.Attempts, SentAt: r.SentAt,
		})
	}
	return c.JSON(http.StatusOK, response.Success(pagination.NewPage(items, total, p)))
}
