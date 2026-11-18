// Package storage implements global.FileUploader on MinIO (S3-compatible object storage).
//
// Two buckets are used:
//   - public:  anonymous read. Profile photos, story images, community banners.
//   - private: never public. Membership cards, documents, member files. Reached only through
//     presigned URLs issued by the API.
//
// Clients never talk to MinIO with credentials; they upload and download through short-lived
// presigned URLs.
package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	config "backend/pkg"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// MinIO is the object storage client.
type MinIO struct {
	client        *minio.Client
	publicBucket  string
	privateBucket string
	publicURL     string
}

// New connects to MinIO and makes sure both buckets exist with the right access rules.
// It returns (nil, nil) when MINIO_ENDPOINT is empty, which disables file storage.
func New(ctx context.Context, cfg *config.Config) (*MinIO, error) {
	if cfg.MinioEndpoint == "" {
		return nil, nil
	}

	client, err := minio.New(cfg.MinioEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccessKey, cfg.MinioSecretKey, ""),
		Secure: cfg.MinioUseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("minio client: %w", err)
	}

	m := &MinIO{
		client:        client,
		publicBucket:  cfg.MinioPublicBucket,
		privateBucket: cfg.MinioPrivateBucket,
		publicURL:     strings.TrimRight(cfg.MinioPublicURL, "/"),
	}

	if err := m.ensureBuckets(ctx); err != nil {
		return nil, err
	}
	return m, nil
}

func (m *MinIO) ensureBuckets(ctx context.Context) error {
	for _, bucket := range []string{m.publicBucket, m.privateBucket} {
		exists, err := m.client.BucketExists(ctx, bucket)
		if err != nil {
			return fmt.Errorf("check bucket %q: %w", bucket, err)
		}
		if !exists {
			if err := m.client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
				return fmt.Errorf("create bucket %q: %w", bucket, err)
			}
		}
	}

	// Public bucket: anonymous read of objects only (no listing, no writes).
	publicPolicy := fmt.Sprintf(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}`, m.publicBucket)
	if err := m.client.SetBucketPolicy(ctx, m.publicBucket, publicPolicy); err != nil {
		return fmt.Errorf("set public bucket policy: %w", err)
	}

	// Private bucket: clear any policy so it can never be anonymously readable.
	if err := m.client.SetBucketPolicy(ctx, m.privateBucket, ""); err != nil {
		return fmt.Errorf("clear private bucket policy: %w", err)
	}
	return nil
}

// PublicBucket and PrivateBucket expose the configured bucket names to modules.
func (m *MinIO) PublicBucket() string  { return m.publicBucket }
func (m *MinIO) PrivateBucket() string { return m.privateBucket }

// checkBucket only allows the two configured buckets, so callers cannot reach arbitrary ones.
func (m *MinIO) checkBucket(bucket string) error {
	if bucket != m.publicBucket && bucket != m.privateBucket {
		return fmt.Errorf("unknown bucket %q", bucket)
	}
	return nil
}

// Upload stores data and returns its public URL. For the private bucket the URL is empty:
// use GeneratePresignedURL to share a private object.
func (m *MinIO) Upload(bucketName, objectName string, data []byte) (string, error) {
	if err := m.checkBucket(bucketName); err != nil {
		return "", err
	}

	_, err := m.client.PutObject(context.Background(), bucketName, objectName,
		bytes.NewReader(data), int64(len(data)),
		minio.PutObjectOptions{ContentType: http.DetectContentType(data)})
	if err != nil {
		return "", err
	}

	if bucketName == m.publicBucket {
		return m.PublicURL(objectName), nil
	}
	return "", nil
}

// Download returns an object's contents.
func (m *MinIO) Download(bucketName, objectName string) ([]byte, error) {
	if err := m.checkBucket(bucketName); err != nil {
		return nil, err
	}

	obj, err := m.client.GetObject(context.Background(), bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, err
	}
	defer obj.Close()
	return io.ReadAll(obj)
}

// Delete removes an object.
func (m *MinIO) Delete(bucketName, objectName string) error {
	if err := m.checkBucket(bucketName); err != nil {
		return err
	}
	return m.client.RemoveObject(context.Background(), bucketName, objectName, minio.RemoveObjectOptions{})
}

// GeneratePresignedURL returns a time-limited download URL.
func (m *MinIO) GeneratePresignedURL(bucketName, objectName string, expirySeconds int) (string, error) {
	if err := m.checkBucket(bucketName); err != nil {
		return "", err
	}
	u, err := m.client.PresignedGetObject(context.Background(), bucketName, objectName,
		time.Duration(expirySeconds)*time.Second, url.Values{})
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

// PresignedUploadURL returns a time-limited URL the client can PUT a file to directly,
// so uploads do not pass through the API.
func (m *MinIO) PresignedUploadURL(bucketName, objectName string, expirySeconds int) (string, error) {
	if err := m.checkBucket(bucketName); err != nil {
		return "", err
	}
	u, err := m.client.PresignedPutObject(context.Background(), bucketName, objectName,
		time.Duration(expirySeconds)*time.Second)
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

// PublicURL returns the permanent URL of an object in the public bucket.
func (m *MinIO) PublicURL(objectName string) string {
	return fmt.Sprintf("%s/%s/%s", m.publicURL, m.publicBucket, objectName)
}

// Ping verifies MinIO is reachable (used by the readiness check).
func (m *MinIO) Ping(ctx context.Context) error {
	_, err := m.client.BucketExists(ctx, m.privateBucket)
	return err
}
