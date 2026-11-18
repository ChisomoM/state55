// Package mail sends email over SMTP and renders the email templates.
//
// Modules never send email inside a request. They call EnqueueTemplate inside their database
// transaction; the outbox hands the message to the queue and HandleSend delivers it with retries.
// A failed send therefore never fails the user's request.
package mail

import (
	"bytes"
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	htmltemplate "html/template"
	"mime"
	"net/smtp"
	"strings"
	texttemplate "text/template"
	"time"

	"backend/infra/outbox"
	"backend/models"
	config "backend/pkg"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"gorm.io/gorm"
)

// TypeSend is the queue task type for sending one email.
const TypeSend = "email:send"

//go:embed templates/*
var templateFS embed.FS

// subjects maps template name -> default subject line. Templates live in templates/<name>.txt
// and .html. A caller can override the subject with data["Subject"] (used by "notification").
var subjects = map[string]string{
	"verify_email":   "Verify your State 55 email address",
	"reset_password": "Reset your State 55 password",
	"invite":         "You've been invited to State 55",
	"notification":   "A message from State 55",
}

// Message is a fully rendered email. It is the queue payload, so it must stay JSON-serializable.
type Message struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Text    string `json:"text"`
	HTML    string `json:"html,omitempty"`
	LogID   string `json:"log_id,omitempty"` // EmailLog row to update with the delivery result
}

// Render builds a Message from a named template.
func Render(to, templateName string, data map[string]interface{}) (Message, error) {
	subject, ok := subjects[templateName]
	if !ok {
		return Message{}, fmt.Errorf("unknown email template %q", templateName)
	}
	if override, ok := data["Subject"].(string); ok && override != "" {
		subject = override
	}

	var text bytes.Buffer
	tt, err := texttemplate.ParseFS(templateFS, "templates/"+templateName+".txt")
	if err != nil {
		return Message{}, err
	}
	if err := tt.Execute(&text, data); err != nil {
		return Message{}, err
	}

	msg := Message{To: to, Subject: subject, Text: text.String()}

	// The HTML version is optional.
	if ht, err := htmltemplate.ParseFS(templateFS, "templates/"+templateName+".html"); err == nil {
		var html bytes.Buffer
		if err := ht.Execute(&html, data); err != nil {
			return Message{}, err
		}
		msg.HTML = html.String()
	}

	return msg, nil
}

// Meta says who an email is for and why. It is stored in the email log.
type Meta struct {
	TenantID uuid.UUID
	UserID   *uuid.UUID // nil when the recipient has no account yet
	Category string     // one of models.Notif* (models.NotifAccount for security/account mail)
}

// EnqueueTemplate renders a template, writes an email-log row, and records the send job in the
// outbox, all inside tx. The email only goes out if the surrounding transaction commits.
func EnqueueTemplate(tx *gorm.DB, meta Meta, to, templateName string, data map[string]interface{}) error {
	msg, err := Render(to, templateName, data)
	if err != nil {
		return err
	}

	entry := models.EmailLog{
		TenantBaseModel: models.TenantBaseModel{TenantID: meta.TenantID},
		UserID:          meta.UserID,
		ToEmail:         to,
		Template:        templateName,
		Category:        meta.Category,
		Subject:         msg.Subject,
		Status:          models.EmailQueued,
	}
	if err := tx.Session(&gorm.Session{NewDB: true}).Create(&entry).Error; err != nil {
		return err
	}

	msg.LogID = entry.ID.String()
	return outbox.Publish(tx, TypeSend, msg)
}

// LogSkipped records that an email was not sent because the member opted out of its category.
func LogSkipped(tx *gorm.DB, meta Meta, to, templateName, subject string) error {
	return tx.Session(&gorm.Session{NewDB: true}).Create(&models.EmailLog{
		TenantBaseModel: models.TenantBaseModel{TenantID: meta.TenantID},
		UserID:          meta.UserID,
		ToEmail:         to,
		Template:        templateName,
		Category:        meta.Category,
		Subject:         subject,
		Status:          models.EmailSkipped,
	}).Error
}

// SMTPSender delivers email through an SMTP server. It implements global.EmailSender.
type SMTPSender struct {
	host, port, username, password, from string
}

// NewSMTPSender builds a sender from config. It returns nil when SMTP_HOST is empty.
func NewSMTPSender(cfg *config.Config) *SMTPSender {
	if cfg.SMTPHost == "" {
		return nil
	}
	return &SMTPSender{
		host:     cfg.SMTPHost,
		port:     cfg.SMTPPort,
		username: cfg.SMTPUsername,
		password: cfg.SMTPPassword,
		from:     cfg.SMTPFromEmail,
	}
}

// Send delivers a plain-text email immediately (no queue). Prefer EnqueueTemplate in request code.
func (s *SMTPSender) Send(to, subject, body string) error {
	return s.SendMessage(Message{To: to, Subject: subject, Text: body})
}

// SendTemplate renders and delivers a template immediately (no queue).
func (s *SMTPSender) SendTemplate(to, templateName string, data map[string]interface{}) error {
	msg, err := Render(to, templateName, data)
	if err != nil {
		return err
	}
	return s.SendMessage(msg)
}

// SendMessage delivers a rendered message, as multipart/alternative when HTML is present.
func (s *SMTPSender) SendMessage(msg Message) error {
	to := stripCRLF(msg.To)
	from := stripCRLF(s.from)

	var b bytes.Buffer
	fmt.Fprintf(&b, "From: %s\r\n", from)
	fmt.Fprintf(&b, "To: %s\r\n", to)
	fmt.Fprintf(&b, "Subject: %s\r\n", mime.QEncoding.Encode("utf-8", stripCRLF(msg.Subject)))
	b.WriteString("MIME-Version: 1.0\r\n")

	if msg.HTML == "" {
		b.WriteString("Content-Type: text/plain; charset=utf-8\r\n\r\n")
		b.WriteString(msg.Text)
	} else {
		const boundary = "state55-alt-boundary"
		fmt.Fprintf(&b, "Content-Type: multipart/alternative; boundary=%s\r\n\r\n", boundary)
		fmt.Fprintf(&b, "--%s\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n%s\r\n", boundary, msg.Text)
		fmt.Fprintf(&b, "--%s\r\nContent-Type: text/html; charset=utf-8\r\n\r\n%s\r\n", boundary, msg.HTML)
		fmt.Fprintf(&b, "--%s--\r\n", boundary)
	}

	var auth smtp.Auth
	if s.username != "" {
		auth = smtp.PlainAuth("", s.username, s.password, s.host)
	}

	return smtp.SendMail(s.host+":"+s.port, auth, from, []string{to}, b.Bytes())
}

// Logger is the part of the application logger HandleSend needs (satisfied by *zap.SugaredLogger).
type Logger interface {
	Infof(template string, args ...interface{})
}

// skipNote is stored in the email log when delivery is switched off with SKIP_EMAILS.
const skipNote = "Not sent: SKIP_EMAILS is enabled"

// HandleSend is the queue handler for TypeSend. Returning an error makes Asynq retry with backoff.
// Each attempt updates the email log: "sent" on success, "failed" (with the error) otherwise.
//
// When skip is true (SKIP_EMAILS) nothing is sent: the message is written to the application log so
// a developer can copy its link, the email log is marked "skipped", and the task succeeds so it is
// never retried and the user's request is unaffected.
func HandleSend(sender *SMTPSender, db *gorm.DB, skip bool, log Logger) func(ctx context.Context, task *asynq.Task) error {
	return func(ctx context.Context, task *asynq.Task) error {
		var msg Message
		if err := json.Unmarshal(task.Payload(), &msg); err != nil {
			// A malformed payload will never succeed, so do not retry it.
			return fmt.Errorf("%v: %w", err, asynq.SkipRetry)
		}

		if skip {
			if log != nil {
				log.Infof("SKIP_EMAILS: not sending %q to %s\n%s", msg.Subject, msg.To, msg.Text)
			}
			recordSkipped(ctx, db, msg.LogID)
			return nil
		}

		var sendErr error
		if sender == nil {
			// SMTP is not configured. Failing (and retrying) keeps the email queued until it is.
			sendErr = errors.New("SMTP is not configured (set SMTP_HOST)")
		} else {
			sendErr = sender.SendMessage(msg)
		}

		recordResult(ctx, db, msg.LogID, sendErr)
		return sendErr
	}
}

// recordSkipped marks the email-log row as skipped because delivery is switched off.
func recordSkipped(ctx context.Context, db *gorm.DB, logID string) {
	if db == nil || logID == "" {
		return
	}
	db.WithContext(ctx).Session(&gorm.Session{NewDB: true}).
		Model(&models.EmailLog{}).Where("id = ?", logID).
		Updates(map[string]interface{}{"status": models.EmailSkipped, "error": skipNote})
}

// recordResult updates the email-log row for a send attempt. Logging problems never fail the send.
func recordResult(ctx context.Context, db *gorm.DB, logID string, sendErr error) {
	if db == nil || logID == "" {
		return
	}

	updates := map[string]interface{}{"attempts": gorm.Expr("attempts + 1")}
	if sendErr == nil {
		updates["status"] = models.EmailSent
		updates["error"] = ""
		updates["sent_at"] = time.Now().UTC()
	} else {
		updates["status"] = models.EmailFailed
		updates["error"] = sendErr.Error()
	}

	db.WithContext(ctx).Session(&gorm.Session{NewDB: true}).
		Model(&models.EmailLog{}).Where("id = ?", logID).Updates(updates)
}

// stripCRLF prevents header injection through user-supplied values.
func stripCRLF(s string) string {
	return strings.NewReplacer("\r", "", "\n", "").Replace(s)
}
