package repository

import (
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/models"
)

// TeamRepository handles team database operations
type TeamRepository struct {
	db *sql.DB
}

// NewTeamRepository creates a new team repository
func NewTeamRepository(db *sql.DB) *TeamRepository {
	return &TeamRepository{db: db}
}

// Create creates a new team
func (r *TeamRepository) Create(team *models.Team) error {
	query := `
		INSERT INTO teams (company_id, name, description)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRow(query, team.CompanyID, team.Name, team.Description).
		Scan(&team.ID, &team.CreatedAt, &team.UpdatedAt)
}

// GetByID retrieves a team by ID
func (r *TeamRepository) GetByID(id uuid.UUID) (*models.Team, error) {
	query := `
		SELECT id, company_id, name, description, created_at, updated_at
		FROM teams
		WHERE id = $1
	`
	team := &models.Team{}
	err := r.db.QueryRow(query, id).Scan(
		&team.ID,
		&team.CompanyID,
		&team.Name,
		&team.Description,
		&team.CreatedAt,
		&team.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get team: %w", err)
	}
	return team, nil
}

// Update updates a team
func (r *TeamRepository) Update(team *models.Team) error {
	query := `
		UPDATE teams
		SET name = $1, description = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING updated_at
	`
	return r.db.QueryRow(query, team.Name, team.Description, team.ID).
		Scan(&team.UpdatedAt)
}

// Delete deletes a team
func (r *TeamRepository) Delete(id uuid.UUID) error {
	query := `DELETE FROM teams WHERE id = $1`
	result, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete team: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("team not found")
	}
	return nil
}

// ListByCompanyID retrieves all teams in a company
func (r *TeamRepository) ListByCompanyID(companyID uuid.UUID) ([]*models.Team, error) {
	query := `
		SELECT id, company_id, name, description, created_at, updated_at
		FROM teams
		WHERE company_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query, companyID)
	if err != nil {
		return nil, fmt.Errorf("failed to list teams: %w", err)
	}
	defer rows.Close()

	var teams []*models.Team
	for rows.Next() {
		team := &models.Team{}
		if err := rows.Scan(
			&team.ID,
			&team.CompanyID,
			&team.Name,
			&team.Description,
			&team.CreatedAt,
			&team.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan team: %w", err)
		}
		teams = append(teams, team)
	}
	return teams, nil
}

// AddMember adds a user to a team
func (r *TeamRepository) AddMember(member *models.TeamMember) error {
	query := `
		INSERT INTO team_members (team_id, user_id, role)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`
	return r.db.QueryRow(query, member.TeamID, member.UserID, member.Role).
		Scan(&member.ID, &member.CreatedAt)
}

// RemoveMember removes a user from a team
func (r *TeamRepository) RemoveMember(teamID, userID uuid.UUID) error {
	query := `DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`
	result, err := r.db.Exec(query, teamID, userID)
	if err != nil {
		return fmt.Errorf("failed to remove team member: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("team member not found")
	}
	return nil
}

// ListMembers retrieves all members of a team
func (r *TeamRepository) ListMembers(teamID uuid.UUID) ([]*models.TeamMember, error) {
	query := `
		SELECT id, team_id, user_id, role, created_at
		FROM team_members
		WHERE team_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query, teamID)
	if err != nil {
		return nil, fmt.Errorf("failed to list team members: %w", err)
	}
	defer rows.Close()

	var members []*models.TeamMember
	for rows.Next() {
		member := &models.TeamMember{}
		if err := rows.Scan(
			&member.ID,
			&member.TeamID,
			&member.UserID,
			&member.Role,
			&member.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan team member: %w", err)
		}
		members = append(members, member)
	}
	return members, nil
}
