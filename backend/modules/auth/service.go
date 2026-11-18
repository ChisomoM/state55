package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"backend/global"
	appmail "backend/infra/mail"
	"backend/models"
	config "backend/pkg"
	"backend/pkg/authtoken"
	"backend/pkg/memberid"
	"backend/pkg/validate"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	verifyEmailTTL   = 24 * time.Hour
	resetPasswordTTL = time.Hour
)

// dummyHash is compared against when the email is unknown, so "no such user" takes as long as
// "wrong password" and response time does not reveal which emails are registered.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("state55-dummy-password"), bcrypt.DefaultCost)

// Service defines authentication operations.
//
// Methods that take a tenantID use the tenant resolved from the request (public routes). Methods
// that take a token (refresh, verify, reset) read the tenant from the token itself, so the
// caller does not need to send a tenant header for them.
type Service interface {
	Login(db *gorm.DB, tenantID uuid.UUID, email, password string) (*LoginResponse, error)
	Register(db *gorm.DB, tenantID uuid.UUID, email, password, firstName, lastName string) (*RegisterResponse, error)
	RefreshToken(db *gorm.DB, refreshToken string) (*LoginResponse, error)

	VerifyEmail(db *gorm.DB, token string) error
	ResendVerification(db *gorm.DB, tenantID uuid.UUID, email string) error

	RequestPasswordReset(db *gorm.DB, tenantID uuid.UUID, email string) error
	ResetPassword(db *gorm.DB, token, newPassword string) error
}

// service implements Service.
type service struct {
	app *global.App
}

// NewService creates a new auth service.
func NewService(app *global.App) Service {
	return &service{app: app}
}

// unscoped drops the request's tenant filter (but keeps the connection). Used by flows that carry
// their own proof of tenant (a signed token or an unguessable emailed token).
func unscoped(db *gorm.DB) *gorm.DB {
	return db.Session(&gorm.Session{NewDB: true})
}

// ---------------------------------------------------------------------------------------------
// Login, registration, refresh
// ---------------------------------------------------------------------------------------------

// Login authenticates a user by email and password within a tenant.
func (s *service) Login(db *gorm.DB, tenantID uuid.UUID, email, password string) (*LoginResponse, error) {
	var user models.User
	err := db.Where("tenant_id = ? AND email = ?", tenantID, email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(password)) // equalize timing
			return nil, ErrInvalidCredentials
		}
		s.app.Logger.Errorf("login: database error: %v", err)
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}
	if !user.IsActive {
		return nil, ErrAccountInactive
	}
	if user.EmailVerifiedAt == nil {
		if !s.app.Config.SkipEmails {
			return nil, ErrEmailNotVerified
		}
		// SKIP_EMAILS: no verification email can arrive, so verify now. This also rescues accounts
		// that registered before the flag was switched on.
		if err := db.Transaction(func(tx *gorm.DB) error { return markVerified(tx, &user) }); err != nil {
			s.app.Logger.Errorf("login: auto-verify: %v", err)
			return nil, err
		}
	}

	resp, err := s.issueSession(db, &user)
	if err == nil {
		s.audit(db, &user, "LOGIN", "session started")
	}
	return resp, err
}

// Register creates an unverified account and queues the verification email.
// No tokens are issued until the email address is verified.
//
// With SKIP_EMAILS on, no email can be delivered, so the account is created already verified (and
// gets its member ID) and no verification email is queued.
func (s *service) Register(db *gorm.DB, tenantID uuid.UUID, email, password, firstName, lastName string) (*RegisterResponse, error) {
	if !validEmail(email) {
		return nil, ErrInvalidEmail
	}
	if err := validatePassword(password); err != nil {
		return nil, err
	}

	var existing int64
	if err := db.Model(&models.User{}).Where("tenant_id = ? AND email = ?", tenantID, email).Count(&existing).Error; err != nil {
		s.app.Logger.Errorf("register: database error: %v", err)
		return nil, err
	}
	if existing > 0 {
		return nil, ErrEmailTaken
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		s.app.Logger.Errorf("register: failed to hash password: %v", err)
		return nil, err
	}

	user := models.User{
		TenantBaseModel: models.TenantBaseModel{TenantID: tenantID},
		Email:           email,
		PasswordHash:    string(hash),
		FirstName:       strings.TrimSpace(firstName),
		LastName:        strings.TrimSpace(lastName),
		RoleSlug:        "user", // Default role
		IsActive:        true,
	}

	skipEmails := s.app.Config.SkipEmails
	if skipEmails {
		now := time.Now().UTC()
		user.EmailVerifiedAt = &now
	}

	// The account, its verification token and the email job are saved together or not at all.
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		if skipEmails {
			return AssignMemberID(tx, user.ID)
		}
		return s.queueVerificationEmail(tx, &user)
	})
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrEmailTaken
		}
		s.app.Logger.Errorf("register: %v", err)
		return nil, err
	}

	if skipEmails {
		s.audit(db, &user, "REGISTER", "account created (email verification skipped)")
	} else {
		s.audit(db, &user, "REGISTER", "account created")
	}
	return &RegisterResponse{User: s.userDTO(db, &user), VerificationSent: !skipEmails}, nil
}

// markVerified verifies a user's email address and assigns their public member ID, exactly as
// following the emailed link would. Used only when SKIP_EMAILS is on.
func markVerified(tx *gorm.DB, user *models.User) error {
	now := time.Now().UTC()
	if err := tx.Model(user).Update("email_verified_at", now).Error; err != nil {
		return err
	}
	return AssignMemberID(tx, user.ID)
}

// RefreshToken exchanges a valid refresh token for a new access + refresh token pair.
func (s *service) RefreshToken(db *gorm.DB, refreshToken string) (*LoginResponse, error) {
	claims, err := authtoken.Parse(s.app.Config.JWTSecret, refreshToken, authtoken.TypeRefresh)
	if err != nil {
		return nil, ErrInvalidToken
	}

	user, err := s.userFromClaims(db, claims)
	if err != nil {
		return nil, err
	}

	return s.issueSession(db, user)
}

// ---------------------------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------------------------

// VerifyEmail consumes a verification token, marks the email verified and assigns the public
// member ID (one person, one ID, tied to a verified email).
func (s *service) VerifyEmail(db *gorm.DB, token string) error {
	var verifiedUser models.User
	err := unscoped(db).Transaction(func(tx *gorm.DB) error {
		at, err := consumeAuthToken(tx, token, models.AuthTokenVerifyEmail)
		if err != nil {
			return err
		}

		var user models.User
		if err := tx.First(&user, "id = ?", at.UserID).Error; err != nil {
			return err
		}

		if user.EmailVerifiedAt == nil {
			now := time.Now().UTC()
			if err := tx.Model(&user).Update("email_verified_at", now).Error; err != nil {
				return err
			}
		}
		if err := AssignMemberID(tx, user.ID); err != nil {
			return err
		}
		verifiedUser = user
		return nil
	})
	if err != nil && !errors.Is(err, ErrInvalidToken) {
		s.app.Logger.Errorf("verify email: %v", err)
	}
	if err == nil {
		s.audit(db, &verifiedUser, "EMAIL_VERIFIED", "email address verified")
	}
	return err
}

// ResendVerification sends a fresh verification email. It always succeeds from the caller's point
// of view so it cannot be used to discover which emails are registered.
func (s *service) ResendVerification(db *gorm.DB, tenantID uuid.UUID, email string) error {
	var user models.User
	err := db.Where("tenant_id = ? AND email = ?", tenantID, email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return err
	}
	if user.EmailVerifiedAt != nil || !user.IsActive {
		return nil
	}

	return db.Transaction(func(tx *gorm.DB) error {
		return s.queueVerificationEmail(tx, &user)
	})
}

func (s *service) queueVerificationEmail(tx *gorm.DB, user *models.User) error {
	raw, err := createAuthToken(tx, user, models.AuthTokenVerifyEmail, verifyEmailTTL)
	if err != nil {
		return err
	}
	return appmail.EnqueueTemplate(tx, mailMeta(user), user.Email, "verify_email", map[string]interface{}{
		"Name":      user.FirstName,
		"Link":      s.link("/verify-email", raw),
		"ExpiresIn": "24 hours",
	})
}

// ---------------------------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------------------------

// RequestPasswordReset emails a reset link. Like ResendVerification it never reveals whether the
// email is registered.
func (s *service) RequestPasswordReset(db *gorm.DB, tenantID uuid.UUID, email string) error {
	var user models.User
	err := db.Where("tenant_id = ? AND email = ?", tenantID, email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return err
	}
	if !user.IsActive {
		return nil
	}

	return db.Transaction(func(tx *gorm.DB) error {
		raw, err := createAuthToken(tx, &user, models.AuthTokenResetPassword, resetPasswordTTL)
		if err != nil {
			return err
		}
		return appmail.EnqueueTemplate(tx, mailMeta(&user), user.Email, "reset_password", map[string]interface{}{
			"Name":      user.FirstName,
			"Link":      s.link("/reset-password", raw),
			"ExpiresIn": "1 hour",
		})
	})
}

// ResetPassword sets a new password using a reset token (single use).
func (s *service) ResetPassword(db *gorm.DB, token, newPassword string) error {
	if err := validatePassword(newPassword); err != nil {
		return err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	var resetUser models.User
	err = unscoped(db).Transaction(func(tx *gorm.DB) error {
		at, err := consumeAuthToken(tx, token, models.AuthTokenResetPassword)
		if err != nil {
			return err
		}

		if err := tx.First(&resetUser, "id = ?", at.UserID).Error; err != nil {
			return err
		}

		updates := map[string]interface{}{"password_hash": string(hash)}

		// Receiving the reset link proves the person controls this mailbox. For an invited user
		// (who never went through email verification) that is the verification.
		if resetUser.EmailVerifiedAt == nil {
			updates["email_verified_at"] = time.Now().UTC()
		}
		if err := tx.Model(&models.User{}).Where("id = ?", resetUser.ID).Updates(updates).Error; err != nil {
			return err
		}
		return AssignMemberID(tx, resetUser.ID)
	})
	if err != nil && !errors.Is(err, ErrInvalidToken) {
		s.app.Logger.Errorf("reset password: %v", err)
	}
	if err == nil {
		s.audit(db, &resetUser, "PASSWORD_RESET", "password changed with a reset link")
	}
	return err
}

// ---------------------------------------------------------------------------------------------
// Tokens and sessions
// ---------------------------------------------------------------------------------------------

// issueSession creates an access token (short-lived) and a refresh token (long-lived).
func (s *service) issueSession(db *gorm.DB, user *models.User) (*LoginResponse, error) {
	now := time.Now()
	cfg := s.app.Config

	access, err := authtoken.Sign(cfg.JWTSecret, jwt.MapClaims{
		"typ":       authtoken.TypeAccess,
		"sub":       user.ID.String(),
		"email":     user.Email,
		"role_slug": user.RoleSlug,
		"tenant_id": user.TenantID.String(),
		"iat":       now.Unix(),
		"exp":       now.Add(cfg.AccessTokenTTL).Unix(),
	})
	if err != nil {
		return nil, err
	}

	refresh, err := authtoken.Sign(cfg.JWTSecret, jwt.MapClaims{
		"typ":       authtoken.TypeRefresh,
		"sub":       user.ID.String(),
		"tenant_id": user.TenantID.String(),
		"jti":       uuid.NewString(),
		"iat":       now.Unix(),
		"exp":       now.Add(cfg.RefreshTokenTTL).Unix(),
	})
	if err != nil {
		return nil, err
	}

	dto := s.userDTO(db, user)
	return &LoginResponse{AccessToken: access, RefreshToken: refresh, User: &dto}, nil
}

// userFromClaims loads the user named by a token's sub + tenant_id and checks the account is usable.
func (s *service) userFromClaims(db *gorm.DB, claims jwt.MapClaims) (*models.User, error) {
	userID, err := uuid.Parse(fmt.Sprint(claims["sub"]))
	if err != nil {
		return nil, ErrInvalidToken
	}
	tenantID, err := uuid.Parse(fmt.Sprint(claims["tenant_id"]))
	if err != nil {
		return nil, ErrInvalidToken
	}

	var user models.User
	if err := unscoped(db).Where("id = ? AND tenant_id = ?", userID, tenantID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidToken
		}
		return nil, err
	}
	if !user.IsActive || user.EmailVerifiedAt == nil {
		return nil, ErrInvalidToken
	}
	return &user, nil
}

// userDTO builds the public view of a user, including the member ID.
func (s *service) userDTO(db *gorm.DB, user *models.User) UserDTO {
	dto := UserDTO{
		ID:            user.ID.String(),
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		RoleSlug:      user.RoleSlug,
		EmailVerified: user.EmailVerifiedAt != nil,
	}

	var mid models.MemberID
	if err := unscoped(db).Where("user_id = ?", user.ID).First(&mid).Error; err == nil {
		dto.MemberID = mid.PublicID
	}
	return dto
}

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

// createAuthToken stores a new single-use token (hashed) and returns the raw value to email.
// Older unused tokens for the same purpose are invalidated.
func createAuthToken(tx *gorm.DB, user *models.User, purpose string, ttl time.Duration) (string, error) {
	now := time.Now().UTC()

	if err := tx.Session(&gorm.Session{NewDB: true}).Model(&models.AuthToken{}).
		Where("user_id = ? AND purpose = ? AND used_at IS NULL", user.ID, purpose).
		Update("used_at", now).Error; err != nil {
		return "", err
	}

	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	raw := base64.RawURLEncoding.EncodeToString(buf)

	err := tx.Session(&gorm.Session{NewDB: true}).Create(&models.AuthToken{
		TenantBaseModel: models.TenantBaseModel{TenantID: user.TenantID},
		UserID:          user.ID,
		Purpose:         purpose,
		TokenHash:       hashToken(raw),
		ExpiresAt:       now.Add(ttl),
	}).Error
	if err != nil {
		return "", err
	}
	return raw, nil
}

// consumeAuthToken validates a raw token and marks it used. The conditional update means two
// concurrent requests with the same token cannot both succeed.
func consumeAuthToken(tx *gorm.DB, raw, purpose string) (*models.AuthToken, error) {
	if raw == "" {
		return nil, ErrInvalidToken
	}
	now := time.Now().UTC()

	var at models.AuthToken
	err := tx.Where("token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?",
		hashToken(raw), purpose, now).First(&at).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidToken
		}
		return nil, err
	}

	res := tx.Session(&gorm.Session{NewDB: true}).Model(&models.AuthToken{}).
		Where("id = ? AND used_at IS NULL", at.ID).Update("used_at", now)
	if res.Error != nil {
		return nil, res.Error
	}
	if res.RowsAffected != 1 {
		return nil, ErrInvalidToken
	}
	return &at, nil
}

// AssignMemberID gives the user a public member ID if they don't have one yet.
// Exported so other modules (and startup seeding) can use it.
func AssignMemberID(tx *gorm.DB, userID uuid.UUID) error {
	tx = tx.Session(&gorm.Session{NewDB: true})

	var existing int64
	if err := tx.Model(&models.MemberID{}).Where("user_id = ?", userID).Count(&existing).Error; err != nil {
		return err
	}
	if existing > 0 {
		return nil
	}

	// Collisions are astronomically unlikely (32^10 combinations), but check anyway; the unique
	// index is the real guarantee.
	for attempt := 0; attempt < 5; attempt++ {
		id, err := memberid.Generate()
		if err != nil {
			return err
		}

		var taken int64
		if err := tx.Model(&models.MemberID{}).Where("public_id = ?", id).Count(&taken).Error; err != nil {
			return err
		}
		if taken > 0 {
			continue
		}
		return tx.Create(&models.MemberID{UserID: userID, PublicID: id}).Error
	}
	return errors.New("could not generate a unique member ID")
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

// link builds a frontend URL carrying a token, e.g. http://localhost:5173/verify-email?token=...
func (s *service) link(path, token string) string {
	return linkFor(s.app.Config, path, token)
}

func linkFor(cfg *config.Config, path, token string) string {
	return strings.TrimRight(cfg.AppBaseURL, "/") + path + "?token=" + url.QueryEscape(token)
}

func validEmail(email string) bool { return validate.Email(email) }

func validatePassword(p string) error {
	if !validate.Password(p) {
		return ErrWeakPassword
	}
	return nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
