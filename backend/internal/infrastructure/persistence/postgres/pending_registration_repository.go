package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/domain/entity"
	"github.com/sogos/mirai-backend/internal/domain/repository"
	"github.com/sogos/mirai-backend/internal/domain/valueobject"
)

// PendingRegistrationRepository implements repository.PendingRegistrationRepository using PostgreSQL.
type PendingRegistrationRepository struct {
	db *sql.DB
}

// NewPendingRegistrationRepository creates a new PostgreSQL pending registration repository.
func NewPendingRegistrationRepository(db *sql.DB) repository.PendingRegistrationRepository {
	return &PendingRegistrationRepository{db: db}
}

// Create creates a new pending registration.
func (r *PendingRegistrationRepository) Create(ctx context.Context, pr *entity.PendingRegistration) error {
	query := `
		INSERT INTO pending_registrations (
			checkout_session_id, email, password_hash, first_name, last_name,
			company_name, industry, team_size, plan, seat_count, status
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, expires_at, updated_at
	`
	err := r.db.QueryRowContext(ctx, query,
		pr.CheckoutSessionID,
		pr.Email,
		pr.PasswordHash,
		pr.FirstName,
		pr.LastName,
		pr.CompanyName,
		pr.Industry,
		pr.TeamSize,
		pr.Plan.String(),
		pr.SeatCount,
		pr.Status.String(),
	).Scan(&pr.ID, &pr.CreatedAt, &pr.ExpiresAt, &pr.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create pending registration: %w", err)
	}
	return nil
}

// GetByID retrieves a pending registration by its ID.
func (r *PendingRegistrationRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.PendingRegistration, error) {
	query := `
		SELECT id, checkout_session_id, email, password_hash, first_name, last_name,
			company_name, industry, team_size, plan, seat_count, status,
			stripe_customer_id, stripe_subscription_id, error_message,
			created_at, expires_at, updated_at
		FROM pending_registrations
		WHERE id = $1
	`
	return r.scanOne(r.db.QueryRowContext(ctx, query, id))
}

// GetByCheckoutSessionID retrieves a pending registration by Stripe checkout session ID.
func (r *PendingRegistrationRepository) GetByCheckoutSessionID(ctx context.Context, sessionID string) (*entity.PendingRegistration, error) {
	query := `
		SELECT id, checkout_session_id, email, password_hash, first_name, last_name,
			company_name, industry, team_size, plan, seat_count, status,
			stripe_customer_id, stripe_subscription_id, error_message,
			created_at, expires_at, updated_at
		FROM pending_registrations
		WHERE checkout_session_id = $1
	`
	return r.scanOne(r.db.QueryRowContext(ctx, query, sessionID))
}

// GetByEmail retrieves a pending registration by email.
func (r *PendingRegistrationRepository) GetByEmail(ctx context.Context, email string) (*entity.PendingRegistration, error) {
	query := `
		SELECT id, checkout_session_id, email, password_hash, first_name, last_name,
			company_name, industry, team_size, plan, seat_count, status,
			stripe_customer_id, stripe_subscription_id, error_message,
			created_at, expires_at, updated_at
		FROM pending_registrations
		WHERE email = $1 AND status IN ('pending', 'paid')
		ORDER BY created_at DESC
		LIMIT 1
	`
	return r.scanOne(r.db.QueryRowContext(ctx, query, email))
}

// ListByStatus retrieves all pending registrations with a given status.
func (r *PendingRegistrationRepository) ListByStatus(ctx context.Context, status valueobject.PendingRegistrationStatus) ([]*entity.PendingRegistration, error) {
	query := `
		SELECT id, checkout_session_id, email, password_hash, first_name, last_name,
			company_name, industry, team_size, plan, seat_count, status,
			stripe_customer_id, stripe_subscription_id, error_message,
			created_at, expires_at, updated_at
		FROM pending_registrations
		WHERE status = $1 AND expires_at > NOW()
		ORDER BY created_at ASC
	`
	rows, err := r.db.QueryContext(ctx, query, status.String())
	if err != nil {
		return nil, fmt.Errorf("failed to list pending registrations: %w", err)
	}
	defer rows.Close()

	var results []*entity.PendingRegistration
	for rows.Next() {
		pr, err := r.scanRow(rows)
		if err != nil {
			return nil, err
		}
		results = append(results, pr)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating pending registrations: %w", err)
	}
	return results, nil
}

// Update updates a pending registration.
func (r *PendingRegistrationRepository) Update(ctx context.Context, pr *entity.PendingRegistration) error {
	query := `
		UPDATE pending_registrations
		SET status = $1, stripe_customer_id = $2, stripe_subscription_id = $3,
			seat_count = $4, error_message = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING updated_at
	`
	err := r.db.QueryRowContext(ctx, query,
		pr.Status.String(),
		pr.StripeCustomerID,
		pr.StripeSubscriptionID,
		pr.SeatCount,
		pr.ErrorMessage,
		pr.ID,
	).Scan(&pr.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to update pending registration: %w", err)
	}
	return nil
}

// Delete deletes a pending registration.
func (r *PendingRegistrationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM pending_registrations WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete pending registration: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("pending registration not found")
	}
	return nil
}

// DeleteExpired deletes all expired pending registrations and returns the count.
func (r *PendingRegistrationRepository) DeleteExpired(ctx context.Context) (int64, error) {
	query := `DELETE FROM pending_registrations WHERE expires_at < NOW() AND status = 'pending'`
	result, err := r.db.ExecContext(ctx, query)
	if err != nil {
		return 0, fmt.Errorf("failed to delete expired pending registrations: %w", err)
	}
	return result.RowsAffected()
}

// ExistsByEmail checks if a pending registration exists for the given email.
func (r *PendingRegistrationRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM pending_registrations WHERE email = $1 AND status IN ('pending', 'paid') AND expires_at > NOW())`
	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check email existence: %w", err)
	}
	return exists, nil
}

// scanOne scans a single row into a PendingRegistration entity.
func (r *PendingRegistrationRepository) scanOne(row *sql.Row) (*entity.PendingRegistration, error) {
	pr := &entity.PendingRegistration{}
	var planStr, statusStr string
	err := row.Scan(
		&pr.ID,
		&pr.CheckoutSessionID,
		&pr.Email,
		&pr.PasswordHash,
		&pr.FirstName,
		&pr.LastName,
		&pr.CompanyName,
		&pr.Industry,
		&pr.TeamSize,
		&planStr,
		&pr.SeatCount,
		&statusStr,
		&pr.StripeCustomerID,
		&pr.StripeSubscriptionID,
		&pr.ErrorMessage,
		&pr.CreatedAt,
		&pr.ExpiresAt,
		&pr.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to scan pending registration: %w", err)
	}
	pr.Plan = valueobject.Plan(planStr)
	pr.Status = valueobject.PendingRegistrationStatus(statusStr)
	return pr, nil
}

// scanRow scans a row from sql.Rows into a PendingRegistration entity.
func (r *PendingRegistrationRepository) scanRow(rows *sql.Rows) (*entity.PendingRegistration, error) {
	pr := &entity.PendingRegistration{}
	var planStr, statusStr string
	err := rows.Scan(
		&pr.ID,
		&pr.CheckoutSessionID,
		&pr.Email,
		&pr.PasswordHash,
		&pr.FirstName,
		&pr.LastName,
		&pr.CompanyName,
		&pr.Industry,
		&pr.TeamSize,
		&planStr,
		&pr.SeatCount,
		&statusStr,
		&pr.StripeCustomerID,
		&pr.StripeSubscriptionID,
		&pr.ErrorMessage,
		&pr.CreatedAt,
		&pr.ExpiresAt,
		&pr.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to scan pending registration row: %w", err)
	}
	pr.Plan = valueobject.Plan(planStr)
	pr.Status = valueobject.PendingRegistrationStatus(statusStr)
	return pr, nil
}
