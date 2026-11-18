package config

import (
	"strings"
	"testing"
	"time"
)

// validConfig returns a config that passes Validate, so each test changes one thing.
func validConfig() *Config {
	return &Config{
		Env:             "development",
		DBHost:          "localhost",
		DBPort:          "5432",
		DBName:          "state55",
		JWTSecret:       "a-long-random-test-secret",
		RedisURL:        "redis://localhost:6379",
		DefaultTenantID: "00000000-0000-0000-0000-000000000001",
	}
}

func TestAccessTokenLivesFourHoursByDefault(t *testing.T) {
	t.Setenv("ACCESS_TOKEN_TTL_MINUTES", "")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.AccessTokenTTL != 4*time.Hour {
		t.Errorf("default access token lifetime = %v, want 4h", cfg.AccessTokenTTL)
	}

	t.Setenv("ACCESS_TOKEN_TTL_MINUTES", "30")
	cfg, err = Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.AccessTokenTTL != 30*time.Minute {
		t.Errorf("override ignored: got %v, want 30m", cfg.AccessTokenTTL)
	}
}

func TestSkipEmailsDefaultsToFalse(t *testing.T) {
	t.Setenv("SKIP_EMAILS", "")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.SkipEmails {
		t.Error("SKIP_EMAILS must default to false so email delivery is never disabled by accident")
	}
}

func TestSkipEmailsReadsEnv(t *testing.T) {
	t.Setenv("SKIP_EMAILS", "true")
	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if !cfg.SkipEmails {
		t.Error("SKIP_EMAILS=true was not picked up")
	}
}

func TestSkipEmailsAllowedOutsideProduction(t *testing.T) {
	cfg := validConfig()
	cfg.SkipEmails = true
	if err := cfg.Validate(); err != nil {
		t.Errorf("SKIP_EMAILS should be allowed in development: %v", err)
	}
}

func TestSkipEmailsRefusedInProduction(t *testing.T) {
	for _, env := range []string{"production", "Production", "PRODUCTION"} {
		cfg := validConfig()
		cfg.Env = env
		cfg.SkipEmails = true
		err := cfg.Validate()
		if err == nil || !strings.Contains(err.Error(), "SKIP_EMAILS") {
			t.Errorf("APP_ENV=%s with SKIP_EMAILS=true must fail validation, got %v", env, err)
		}
	}

	cfg := validConfig()
	cfg.Env = "production"
	if err := cfg.Validate(); err != nil {
		t.Errorf("production with SKIP_EMAILS off must still validate: %v", err)
	}
}
