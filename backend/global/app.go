package global

import (
	config "backend/pkg"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// App holds all shared infrastructure for the application.
// This is the single place where top-level infrastructure services (email, upload, config, logger)
// are initialized and stored. It is passed to module factories at startup.
//
// CRITICAL RULE: App NEVER contains *gorm.DB (or any tenant-scoped resource).
// Database access is always per-request, scoped by TenantMiddleware, and passed through
// handler → service as a method parameter.
//
// For adding new infrastructure services (e.g., cache, queue, auth provider):
// 1. Add the field to App struct with an interface type, not concrete type
// 2. Initialize in New()
// 3. Module services receive App and use app.ServiceInterface
type App struct {
	Config *config.Config
	Logger *zap.SugaredLogger

	// Infrastructure services (tenant-agnostic)
	// Use interfaces to allow swapping implementations per project
	Email  EmailSender
	Upload FileUploader
	Redis  *redis.Client // Shared Redis connection (cache, rate limits, queue backing store)
}

// EmailSender is an interface for email services.
// Implementations can be SMTP, SendGrid, AWS SES, etc.
type EmailSender interface {
	Send(to, subject, body string) error
	SendTemplate(to, templateName string, data map[string]interface{}) error
}

// FileUploader is an interface for file storage services.
// Implementations can be MinIO, AWS S3, local filesystem, etc.
type FileUploader interface {
	Upload(bucketName, objectName string, data []byte) (url string, err error)
	Download(bucketName, objectName string) ([]byte, error)
	Delete(bucketName, objectName string) error
	// GeneratePresignedURL returns a time-limited download URL.
	GeneratePresignedURL(bucketName, objectName string, expirySeconds int) (url string, err error)
	// PresignedUploadURL returns a time-limited URL a client can PUT a file to directly.
	PresignedUploadURL(bucketName, objectName string, expirySeconds int) (url string, err error)
	// PublicBucket and PrivateBucket name the two buckets: public is anonymous-read,
	// private is reachable only through presigned URLs.
	PublicBucket() string
	PrivateBucket() string
}

// New creates a new App with all infrastructure services initialized.
// This is called once at startup in main().
func New(
	cfg *config.Config,
	logger *zap.SugaredLogger,
	emailService EmailSender,
	uploadService FileUploader,
	redisClient *redis.Client,
) *App {
	return &App{
		Config: cfg,
		Logger: logger,
		Email:  emailService,
		Upload: uploadService,
		Redis:  redisClient,
	}
}
