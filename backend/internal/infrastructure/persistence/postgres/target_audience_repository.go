package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/sogos/mirai-backend/internal/domain/entity"
	"github.com/sogos/mirai-backend/internal/domain/repository"
	"github.com/sogos/mirai-backend/internal/domain/valueobject"
)

// TargetAudienceRepository implements repository.TargetAudienceRepository using PostgreSQL.
type TargetAudienceRepository struct {
	db *sql.DB
}

// NewTargetAudienceRepository creates a new PostgreSQL target audience repository.
func NewTargetAudienceRepository(db *sql.DB) repository.TargetAudienceRepository {
	return &TargetAudienceRepository{db: db}
}

// Create creates a new template.
func (r *TargetAudienceRepository) Create(ctx context.Context, template *entity.TargetAudienceTemplate) error {
	query := `
		INSERT INTO target_audience_templates (tenant_id, company_id, name, description, role, experience_level, learning_goals, prerequisites, challenges, motivations, industry_context, typical_background, status, created_by_user_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(ctx, query,
		template.TenantID,
		template.CompanyID,
		template.Name,
		template.Description,
		template.Role,
		template.ExperienceLevel.String(),
		pq.Array(template.LearningGoals),
		pq.Array(template.Prerequisites),
		pq.Array(template.Challenges),
		pq.Array(template.Motivations),
		template.IndustryContext,
		template.TypicalBackground,
		template.Status.String(),
		template.CreatedByUserID,
	).Scan(&template.ID, &template.CreatedAt, &template.UpdatedAt)
}

// GetByID retrieves a template by its ID.
func (r *TargetAudienceRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.TargetAudienceTemplate, error) {
	query := `
		SELECT id, tenant_id, company_id, name, description, role, experience_level, learning_goals, prerequisites, challenges, motivations, industry_context, typical_background, status, created_by_user_id, created_at, updated_at
		FROM target_audience_templates
		WHERE id = $1
	`
	template := &entity.TargetAudienceTemplate{}
	var expLevelStr, statusStr string
	var learningGoals, prerequisites, challenges, motivations pq.StringArray
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&template.ID,
		&template.TenantID,
		&template.CompanyID,
		&template.Name,
		&template.Description,
		&template.Role,
		&expLevelStr,
		&learningGoals,
		&prerequisites,
		&challenges,
		&motivations,
		&template.IndustryContext,
		&template.TypicalBackground,
		&statusStr,
		&template.CreatedByUserID,
		&template.CreatedAt,
		&template.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}
	template.ExperienceLevel, _ = valueobject.ParseExperienceLevel(expLevelStr)
	template.Status, _ = valueobject.ParseTargetAudienceStatus(statusStr)
	template.LearningGoals = []string(learningGoals)
	template.Prerequisites = []string(prerequisites)
	template.Challenges = []string(challenges)
	template.Motivations = []string(motivations)
	return template, nil
}

// List retrieves all templates for the current tenant.
func (r *TargetAudienceRepository) List(ctx context.Context) ([]*entity.TargetAudienceTemplate, error) {
	query := `
		SELECT id, tenant_id, company_id, name, description, role, experience_level, learning_goals, prerequisites, challenges, motivations, industry_context, typical_background, status, created_by_user_id, created_at, updated_at
		FROM target_audience_templates
		ORDER BY name ASC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list templates: %w", err)
	}
	defer rows.Close()

	var templates []*entity.TargetAudienceTemplate
	for rows.Next() {
		template := &entity.TargetAudienceTemplate{}
		var expLevelStr, statusStr string
		var learningGoals, prerequisites, challenges, motivations pq.StringArray
		if err := rows.Scan(
			&template.ID,
			&template.TenantID,
			&template.CompanyID,
			&template.Name,
			&template.Description,
			&template.Role,
			&expLevelStr,
			&learningGoals,
			&prerequisites,
			&challenges,
			&motivations,
			&template.IndustryContext,
			&template.TypicalBackground,
			&statusStr,
			&template.CreatedByUserID,
			&template.CreatedAt,
			&template.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan template: %w", err)
		}
		template.ExperienceLevel, _ = valueobject.ParseExperienceLevel(expLevelStr)
		template.Status, _ = valueobject.ParseTargetAudienceStatus(statusStr)
		template.LearningGoals = []string(learningGoals)
		template.Prerequisites = []string(prerequisites)
		template.Challenges = []string(challenges)
		template.Motivations = []string(motivations)
		templates = append(templates, template)
	}
	return templates, nil
}

// Update updates a template.
func (r *TargetAudienceRepository) Update(ctx context.Context, template *entity.TargetAudienceTemplate) error {
	query := `
		UPDATE target_audience_templates
		SET name = $1, description = $2, role = $3, experience_level = $4, learning_goals = $5, prerequisites = $6, challenges = $7, motivations = $8, industry_context = $9, typical_background = $10, status = $11, updated_at = NOW()
		WHERE id = $12
		RETURNING updated_at
	`
	return r.db.QueryRowContext(ctx, query,
		template.Name,
		template.Description,
		template.Role,
		template.ExperienceLevel.String(),
		pq.Array(template.LearningGoals),
		pq.Array(template.Prerequisites),
		pq.Array(template.Challenges),
		pq.Array(template.Motivations),
		template.IndustryContext,
		template.TypicalBackground,
		template.Status.String(),
		template.ID,
	).Scan(&template.UpdatedAt)
}

// Delete deletes a template.
func (r *TargetAudienceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM target_audience_templates WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("template not found")
	}
	return nil
}
