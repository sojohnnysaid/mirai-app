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
		INSERT INTO companies (name, plan)
		VALUES ($1, $2)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, company.Name, company.Plan).
		Scan(&company.ID, &company.CreatedAt, &company.UpdatedAt)
}

// GetByID retrieves a company by ID
func (r *CompanyRepository) GetByID(id uuid.UUID) (*models.Company, error) {
	query := `
		SELECT id, name, plan, created_at, updated_at
		FROM companies
		WHERE id = $1
	`
	company := &models.Company{}
	err := r.db.QueryRow(query, id).Scan(
		&company.ID,
		&company.Name,
		&company.Plan,
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
