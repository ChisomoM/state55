// Package ratelimit implements fixed-window rate limiting on Redis.
//
// Counters are shared by every API instance. Callers decide what to do when Redis is down; the
// auth endpoints fail closed (refuse the request) so an outage cannot be used to brute-force logins.
package ratelimit

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/redis/go-redis/v9"
)

// Limiter counts events per key in a window.
type Limiter struct {
	rdb *redis.Client
}

// New creates a limiter on a Redis client.
func New(rdb *redis.Client) *Limiter {
	return &Limiter{rdb: rdb}
}

// Result is the outcome of one Allow call.
type Result struct {
	Allowed    bool
	RetryAfter time.Duration // Only meaningful when !Allowed
}

// INCR creates the key at 1; the first hit in a window sets its expiry. Doing both in one script
// means a crash between the two steps cannot leave a counter that never expires.
var script = redis.NewScript(`
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return {count, redis.call('PTTL', KEYS[1])}
`)

// Allow records one event for key and reports whether it is within limit events per window.
func (l *Limiter) Allow(ctx context.Context, key string, limit int, window time.Duration) (Result, error) {
	vals, err := script.Run(ctx, l.rdb, []string{"rl:" + key}, window.Milliseconds()).Int64Slice()
	if err != nil {
		return Result{}, err
	}
	if len(vals) != 2 {
		return Result{}, redis.Nil
	}

	count, ttl := vals[0], vals[1]
	if count <= int64(limit) {
		return Result{Allowed: true}, nil
	}

	retry := time.Duration(ttl) * time.Millisecond
	if retry < time.Second {
		retry = time.Second
	}
	return Result{Allowed: false, RetryAfter: retry}, nil
}

// Hash shortens and anonymizes a value (an email, a token) for use in a key, so no personal data
// or secrets are stored in Redis.
func Hash(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:12])
}
