package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

const (
	// Retry configuration for database connections
	maxRetries     = 10
	initialBackoff = 1 * time.Second
	maxBackoff     = 30 * time.Second
	pingTimeout    = 5 * time.Second
)

// DB holds the database connection.
type DB struct {
	*sql.DB
}

// NewDB creates a new database connection with retry logic.
func NewDB(databaseURL string) (*DB, error) {
	return NewDBWithContext(context.Background(), databaseURL)
}

// NewDBWithContext creates a new database connection with retry logic and context support.
func NewDBWithContext(ctx context.Context, databaseURL string) (*DB, error) {
	var db *sql.DB
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		// Check context cancellation
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("database connection cancelled: %w", ctx.Err())
		default:
		}

		// Log retry attempts (skip first attempt)
		if attempt > 0 {
			log.Printf("Database connection attempt %d/%d after error: %v", attempt+1, maxRetries, lastErr)
		}

		db, lastErr = sql.Open("postgres", databaseURL)
		if lastErr != nil {
			backoff := calculateBackoff(attempt)
			log.Printf("Failed to open database, retrying in %v: %v", backoff, lastErr)
			select {
			case <-ctx.Done():
				return nil, fmt.Errorf("database connection cancelled: %w", ctx.Err())
			case <-time.After(backoff):
				continue
			}
		}

		// Configure connection pool before testing
		db.SetMaxOpenConns(25)
		db.SetMaxIdleConns(5)
		db.SetConnMaxLifetime(5 * time.Minute)
		db.SetConnMaxIdleTime(1 * time.Minute)

		// Ping with timeout
		pingCtx, cancel := context.WithTimeout(ctx, pingTimeout)
		lastErr = db.PingContext(pingCtx)
		cancel()

		if lastErr == nil {
			log.Printf("Database connection established successfully")
			return &DB{db}, nil
		}

		// Close failed connection before retry
		db.Close()

		backoff := calculateBackoff(attempt)
		log.Printf("Failed to ping database, retrying in %v: %v", backoff, lastErr)
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("database connection cancelled: %w", ctx.Err())
		case <-time.After(backoff):
			continue
		}
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, lastErr)
}

// calculateBackoff returns exponential backoff duration capped at maxBackoff.
func calculateBackoff(attempt int) time.Duration {
	backoff := initialBackoff * time.Duration(1<<uint(attempt))
	if backoff > maxBackoff {
		backoff = maxBackoff
	}
	return backoff
}

// Close closes the database connection.
func (db *DB) Close() error {
	return db.DB.Close()
}
