package repository

import (
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/models"
)

// UserRepository handles user database operations
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create creates a new user
func (r *UserRepository) Create(user *models.User) error {
	query := `
		INSERT INTO users (kratos_id, company_id, role)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, user.KratosID, user.CompanyID, user.Role).
		Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

// GetByKratosID retrieves a user by their Kratos ID
func (r *UserRepository) GetByKratosID(kratosID uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, kratos_id, company_id, role, created_at, updated_at
		FROM users
		WHERE kratos_id = $1
	`
	user := &models.User{}
	err := r.db.QueryRow(query, kratosID).Scan(
		&user.ID,
		&user.KratosID,
		&user.CompanyID,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

// GetByID retrieves a user by their ID
func (r *UserRepository) GetByID(id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, kratos_id, company_id, role, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	user := &models.User{}
	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.KratosID,
		&user.CompanyID,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

// Update updates a user
func (r *UserRepository) Update(user *models.User) error {
	query := `
		UPDATE users
		SET company_id = $1, role = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING updated_at
	`
	return r.db.QueryRow(query, user.CompanyID, user.Role, user.ID).
		Scan(&user.UpdatedAt)
}

// ListByCompanyID retrieves all users in a company
func (r *UserRepository) ListByCompanyID(companyID uuid.UUID) ([]*models.User, error) {
	query := `
		SELECT id, kratos_id, company_id, role, created_at, updated_at
		FROM users
		WHERE company_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		if err := rows.Scan(
			&user.ID,
			&user.KratosID,
			&user.CompanyID,
			&user.Role,
			&user.CreatedAt,
			&user.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, user)
	}
	return users, nil
}

// GetOwnerByCompanyID retrieves the owner user of a company
func (r *UserRepository) GetOwnerByCompanyID(companyID uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, kratos_id, company_id, role, created_at, updated_at
		FROM users
		WHERE company_id = $1 AND role = 'owner'
		LIMIT 1
	`
	user := &models.User{}
	err := r.db.QueryRow(query, companyID).Scan(
		&user.ID,
		&user.KratosID,
		&user.CompanyID,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get owner: %w", err)
	}
	return user, nil
}
