package mail

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"testing"

	"github.com/hibiken/asynq"
)

type captureLog struct{ lines []string }

func (c *captureLog) Infof(format string, args ...interface{}) {
	c.lines = append(c.lines, fmt.Sprintf(format, args...))
}

func TestHandleSendSkipsWhenSkipEmailsIsOn(t *testing.T) {
	msg := Message{To: "a@b.co", Subject: "Verify", Text: "open http://x/verify?token=abc"}
	payload, _ := json.Marshal(msg)
	log := &captureLog{}

	// No SMTP sender and no database: with skip on, neither is needed and the task must succeed.
	handler := HandleSend(nil, nil, true, log)
	if err := handler(context.Background(), asynq.NewTask(TypeSend, payload)); err != nil {
		t.Fatalf("a skipped email must not fail (it would be retried): %v", err)
	}
	if len(log.lines) != 1 || !strings.Contains(log.lines[0], "token=abc") {
		t.Errorf("the skipped message and its link should be logged, got %v", log.lines)
	}
}

func TestHandleSendStillFailsWithoutSMTPWhenSkipIsOff(t *testing.T) {
	payload, _ := json.Marshal(Message{To: "a@b.co", Subject: "Verify", Text: "hi"})
	handler := HandleSend(nil, nil, false, nil)
	if err := handler(context.Background(), asynq.NewTask(TypeSend, payload)); err == nil {
		t.Error("with skip off and no SMTP, the send must fail so it stays queued and retries")
	}
}

func TestRenderTemplates(t *testing.T) {
	for _, name := range []string{"verify_email", "reset_password"} {
		msg, err := Render("a@b.co", name, map[string]interface{}{
			"Name": "Amina", "Link": "http://x/y?token=abc", "ExpiresIn": "1 hour",
		})
		if err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		if msg.To != "a@b.co" || msg.Subject == "" {
			t.Errorf("%s: bad envelope: %+v", name, msg)
		}
		if !strings.Contains(msg.Text, "http://x/y?token=abc") || !strings.Contains(msg.HTML, "http://x/y?token=abc") {
			t.Errorf("%s: link missing from text or html body", name)
		}
	}
}

func TestRenderInviteAndNotification(t *testing.T) {
	invite, err := Render("a@b.co", "invite", map[string]interface{}{
		"Name": "Amina", "Link": "http://x/reset-password?token=abc", "ExpiresIn": "7 days",
	})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(invite.Text, "token=abc") || !strings.Contains(invite.HTML, "token=abc") {
		t.Error("invite is missing its link")
	}

	n, err := Render("a@b.co", "notification", map[string]interface{}{
		"Subject": "Voting opens Monday", "Body": "Polls open at 9am.", "Link": "http://x/vote", "LinkLabel": "Open ballot",
	})
	if err != nil {
		t.Fatal(err)
	}
	if n.Subject != "Voting opens Monday" {
		t.Errorf("subject override ignored: %q", n.Subject)
	}
	if !strings.Contains(n.Text, "Polls open at 9am.") || !strings.Contains(n.HTML, "Open ballot") {
		t.Error("notification body or link missing")
	}
}

func TestRenderEscapesHTMLInUserData(t *testing.T) {
	msg, err := Render("a@b.co", "notification", map[string]interface{}{
		"Body": `<script>alert(1)</script>`,
	})
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(msg.HTML, "<script>") {
		t.Error("user-supplied HTML was not escaped in the HTML body")
	}
}

func TestRenderUnknownTemplate(t *testing.T) {
	if _, err := Render("a@b.co", "nope", nil); err == nil {
		t.Fatal("expected error for unknown template")
	}
}

func TestStripCRLFPreventsHeaderInjection(t *testing.T) {
	got := stripCRLF("victim@x.co\r\nBcc: attacker@y.co")
	if strings.ContainsAny(got, "\r\n") {
		t.Fatalf("CR/LF survived: %q", got)
	}
}
