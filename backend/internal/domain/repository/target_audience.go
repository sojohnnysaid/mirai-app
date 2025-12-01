package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/domain/entity"
)

// TargetAudienceRepository defines the interface for target audience template data access.
type TargetAudienceRepository interface {
	// Create creates a new template.
	Create(ctx context.Context, template *entity.TargetAudienceTemplate) error

	// GetByID retrieves a template by its ID.
	GetByID(ctx context.Context, id uuid.UUID) (*entity.TargetAudienceTemplate, error)

	// List retrieves all templates for the current tenant.
	List(ctx context.Context) ([]*entity.TargetAudienceTemplate, error)

	// Update updates a template.
	Update(ctx context.Context, template *entity.TargetAudienceTemplate) error

	// Delete deletes a template.
	Delete(ctx context.Context, id uuid.UUID) error
}
