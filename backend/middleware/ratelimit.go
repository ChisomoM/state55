package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"backend/infra/ratelimit"
	"backend/pkg/response"

	"github.com/labstack/echo/v4"
)

// KeyFunc picks what a limit is counted against (client IP, signed-in user, ...).
type KeyFunc func(c echo.Context) string

// ByIP counts per client IP. The IP comes from Echo's IPExtractor, which main.go configures to
// trust forwarded headers only from the configured proxies.
func ByIP(c echo.Context) string { return "ip:" + c.RealIP() }

// ByUser counts per authenticated user (use after JWTMiddleware).
func ByUser(c echo.Context) string {
	id, _ := c.Get("user_id").(string)
	return "user:" + id
}

// RateLimit limits a route to `limit` requests per `window` for each key.
// `name` namespaces the counter, so every route (or group of routes) has its own budget.
func RateLimit(l *ratelimit.Limiter, name string, limit int, window time.Duration, key KeyFunc) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if !AllowRequest(c, l, name, key(c), limit, window) {
				return nil // AllowRequest already wrote the response
			}
			return next(c)
		}
	}
}

// AllowRequest applies a limit inside a handler, for keys the middleware cannot see (an email in the
// request body). It writes the response itself and returns false when the request must stop:
//   - 429 with a Retry-After header when the limit is exceeded;
//   - 503 when Redis is unavailable. This fails closed on purpose: rate limits protect logins,
//     so an outage must not become a way around them.
//
// A nil limiter allows everything (used in tests).
func AllowRequest(c echo.Context, l *ratelimit.Limiter, name, key string, limit int, window time.Duration) bool {
	if l == nil {
		return true
	}

	res, err := l.Allow(c.Request().Context(), name+":"+key, limit, window)
	if err != nil {
		c.Logger().Errorf("rate limiter unavailable: %v", err)
		_ = c.JSON(http.StatusServiceUnavailable,
			response.ErrorCode("rate_limit_unavailable", "Service temporarily unavailable. Please try again shortly."))
		return false
	}

	if !res.Allowed {
		secs := int(res.RetryAfter.Seconds())
		c.Response().Header().Set("Retry-After", strconv.Itoa(secs))
		_ = c.JSON(http.StatusTooManyRequests,
			response.ErrorCode("rate_limited", fmt.Sprintf("Too many attempts. Try again in %s.", humanDuration(res.RetryAfter))))
		return false
	}
	return true
}

func humanDuration(d time.Duration) string {
	switch {
	case d >= time.Hour:
		return fmt.Sprintf("%d hour(s)", int(d.Round(time.Hour)/time.Hour))
	case d >= time.Minute:
		return fmt.Sprintf("%d minute(s)", int(d.Round(time.Minute)/time.Minute))
	default:
		return fmt.Sprintf("%d second(s)", int(d.Seconds()))
	}
}
