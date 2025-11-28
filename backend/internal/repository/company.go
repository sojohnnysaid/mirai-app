package repository

import (
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/models"
)

// CompanyRepository handles company database operations
type CompanyRepository struct {
	db *sql.DB
}

// NewCompanyRepository creates a new company repository
func NewCompanyRepository(db *sql.DB) *CompanyRepository {
	return &CompanyRepository{db: db}
}

// Create creates a new company
func (r *CompanyRepository) Create(company *models.Company) error {
	query := `
		INSERT INTO companies (name, industry, team_size, plan, subscription_status)
		VALUES ($1, $2, $3, $4, 'none')
		RETURNING id, subscription_status, created_at, updated_at
	`
	return r.db.QueryRow(query, company.Name, company.Industry, company.TeamSize, company.Plan).
		Scan(&company.ID, &company.SubscriptionStatus, &company.CreatedAt, &company.UpdatedAt)
}

// GetByID retrieves a company by ID
func (r *CompanyRepository) GetByID(id uuid.UUID) (*models.Company, error) {
	query := `
		SELECT id, name, industry, team_size, plan, stripe_customer_id, stripe_subscription_id, subscription_status, created_at, updated_at
		FROM companies
		WHERE id = $1
	`
	company := &models.Company{}
	err := r.db.QueryRow(query, id).Scan(
		&company.ID,
		&company.Name,
		&company.Industry,
		&company.TeamSize,
		&company.Plan,
		&company.StripeCustomerID,
		&company.StripeSubscriptionID,
		&company.SubscriptionStatus,
		&company.CreatedAt,
		&company.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get company: %w", err)
	}
	return company, nil
}

// Update updates a company
func (r *CompanyRepository) Update(company *models.Company) error {
	query := `
		UPDATE companies
		SET name = $1, plan = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING updated_at
	`
	return r.db.QueryRow(query, company.Name, company.Plan, company.ID).
		Scan(&company.UpdatedAt)
}

// Delete deletes a company
func (r *CompanyRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM companies WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete company: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("company not found")
	}
	return nil
}

// GetByStripeCustomerID retrieves a company by Stripe customer ID
func (r *CompanyRepository) GetByStripeCustomerID(stripeCustomerID string) (*models.Company, error) {
	query := `
		SELECT id, name, industry, team_size, plan, stripe_customer_id, stripe_subscription_id, subscription_status, created_at, updated_at
		FROM companies
		WHERE stripe_customer_id = $1
	`
	company := &models.Company{}
	err := r.db.QueryRow(query, stripeCustomerID).Scan(
		&company.ID,
		&company.Name,
		&company.Industry,
		&company.TeamSize,
		&company.Plan,
		&company.StripeCustomerID,
		&company.StripeSubscriptionID,
		&company.SubscriptionStatus,
		&company.CreatedAt,
		&company.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get company by stripe customer id: %w", err)
	}
	return company, nil
}

// UpdateStripeFields updates the Stripe-related fields for a company
func (r *CompanyRepository) UpdateStripeFields(companyID uuid.UUID, stripeCustomerID, stripeSubscriptionID *string, subscriptionStatus, plan string) error {
	query := `
		UPDATE companies
		SET stripe_customer_id = $1, stripe_subscription_id = $2, subscription_status = $3, plan = $4, updated_at = NOW()
		WHERE id = $5
	`
	result, err := r.db.Exec(query, stripeCustomerID, stripeSubscriptionID, subscriptionStatus, plan, companyID)
	if err != nil {
		return fmt.Errorf("failed to update stripe fields: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("company not found")
	}
	return nil
}

// CountUsersByCompanyID counts the number of users in a company
func (r *CompanyRepository) CountUsersByCompanyID(companyID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM users WHERE company_id = $1`
	var count int
	err := r.db.QueryRow(query, companyID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count users: %w", err)
	}
	return count, nil
}
