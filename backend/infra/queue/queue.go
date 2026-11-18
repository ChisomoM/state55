// Package queue wraps Asynq: a Redis-backed job queue.
//
// The Asynq server runs inside the API process (no separate worker binary yet). Handlers are
// registered by type; because jobs only know their type and a JSON payload, moving the server
// into its own process later does not change any handler.
//
// Modules should not call Enqueue directly for work tied to a database change. Use the outbox
// package, which writes the job in the same transaction and hands it to the queue afterwards.
package queue

import (
	"context"
	"fmt"

	"github.com/hibiken/asynq"
	"go.uber.org/zap"
)

// Client enqueues jobs.
type Client struct {
	client *asynq.Client
}

// NewClient creates a queue client from a Redis URL.
func NewClient(redisURL string) (*Client, error) {
	opt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid REDIS_URL: %w", err)
	}
	return &Client{client: asynq.NewClient(opt)}, nil
}

// Enqueue adds a task to the queue.
func (c *Client) Enqueue(ctx context.Context, task *asynq.Task, opts ...asynq.Option) error {
	_, err := c.client.EnqueueContext(ctx, task, opts...)
	return err
}

// Close releases the client's Redis connection.
func (c *Client) Close() error {
	return c.client.Close()
}

// Server processes queued jobs.
type Server struct {
	server *asynq.Server
	mux    *asynq.ServeMux
}

// NewServer creates a job server from a Redis URL.
func NewServer(redisURL string, concurrency int, logger *zap.SugaredLogger) (*Server, error) {
	opt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid REDIS_URL: %w", err)
	}

	srv := asynq.NewServer(opt, asynq.Config{
		Concurrency: concurrency,
		Logger:      logger, // *zap.SugaredLogger satisfies asynq.Logger
	})

	return &Server{server: srv, mux: asynq.NewServeMux()}, nil
}

// Handle registers a handler for a task type. Call before Start.
func (s *Server) Handle(taskType string, handler func(ctx context.Context, task *asynq.Task) error) {
	s.mux.HandleFunc(taskType, handler)
}

// Start begins processing jobs in the background.
func (s *Server) Start() error {
	return s.server.Start(s.mux)
}

// Shutdown stops accepting jobs and waits for running ones to finish.
func (s *Server) Shutdown() {
	s.server.Shutdown()
}
