// Package outbox implements the transactional outbox.
//
// Problem: if a module saves data and then enqueues a job, a crash between the two loses the job
// (or the job runs for data that was rolled back). Instead, the module calls Publish inside its
// database transaction, so the job exists if and only if the data does. A Dispatcher then moves
// pending rows into the Asynq queue.
//
// Delivery is at-least-once. The outbox row ID is used as the Asynq task ID (and completed tasks
// are retained for a day) so duplicates are normally suppressed, but job handlers should still be
// safe to run twice.
package outbox

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"backend/infra/queue"
	"backend/models"

	"github.com/hibiken/asynq"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Event is a pending job. EventType doubles as the Asynq task type.
type Event struct {
	models.BaseModel
	EventType    string     `json:"event_type" gorm:"not null;index"`
	Payload      []byte     `json:"payload" gorm:"type:jsonb;not null"`
	DispatchedAt *time.Time `json:"dispatched_at,omitempty" gorm:"index"`
	Attempts     int        `json:"attempts"`
	LastError    string     `json:"last_error,omitempty" gorm:"type:text"`
}

// TableName keeps the table name stable and explicit.
func (Event) TableName() string { return "outbox_events" }

// Publish records a job inside the caller's transaction. Pass the transaction handle (tx), not the
// bare connection, otherwise the job is not tied to the data change.
func Publish(tx *gorm.DB, eventType string, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	// NewDB drops any tenant WHERE clause carried by the request-scoped handle but keeps the
	// underlying transaction.
	return tx.Session(&gorm.Session{NewDB: true}).Create(&Event{
		EventType: eventType,
		Payload:   data,
	}).Error
}

// Dispatcher moves pending outbox rows into the queue.
type Dispatcher struct {
	db       *gorm.DB
	client   *queue.Client
	logger   *zap.SugaredLogger
	interval time.Duration
	batch    int
}

// NewDispatcher creates a dispatcher that polls every interval.
func NewDispatcher(db *gorm.DB, client *queue.Client, logger *zap.SugaredLogger, interval time.Duration) *Dispatcher {
	return &Dispatcher{db: db, client: client, logger: logger, interval: interval, batch: 50}
}

// Run polls until ctx is cancelled. Run it in its own goroutine.
func (d *Dispatcher) Run(ctx context.Context) {
	ticker := time.NewTicker(d.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Drain: keep going while batches come back full.
			for {
				n, err := d.dispatchBatch(ctx)
				if err != nil {
					d.logger.Errorf("outbox dispatch failed: %v", err)
					break
				}
				if n < d.batch {
					break
				}
			}
		}
	}
}

// dispatchBatch enqueues up to one batch of pending events and returns how many were dispatched.
// Rows are locked with SKIP LOCKED so several API instances can run dispatchers safely.
func (d *Dispatcher) dispatchBatch(ctx context.Context) (int, error) {
	handled := 0

	err := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var events []Event
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
			Where("dispatched_at IS NULL").
			Order("created_at").
			Limit(d.batch).
			Find(&events).Error; err != nil {
			return err
		}

		for i := range events {
			e := &events[i]

			task := asynq.NewTask(e.EventType, e.Payload)
			err := d.client.Enqueue(ctx, task,
				asynq.TaskID(e.ID.String()),
				asynq.MaxRetry(10),
				asynq.Retention(24*time.Hour), // keeps the task ID reserved so a re-dispatch is a no-op
			)

			// A conflict means this event was already enqueued (crash before we marked it).
			if err != nil && !errors.Is(err, asynq.ErrTaskIDConflict) {
				e.Attempts++
				e.LastError = err.Error()
				if uerr := tx.Model(e).Select("attempts", "last_error").Updates(e).Error; uerr != nil {
					return uerr
				}
				d.logger.Warnf("outbox: enqueue %s failed (attempt %d): %v", e.ID, e.Attempts, err)
				continue
			}

			now := time.Now().UTC()
			if err := tx.Model(e).Update("dispatched_at", now).Error; err != nil {
				return err
			}
			handled++ // only successes count, so a failing batch does not make Run spin
		}
		return nil
	})

	return handled, err
}
