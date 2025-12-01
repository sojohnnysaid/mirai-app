package entity

import (
	"time"

	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/domain/valueobject"
)

// TargetAudienceTemplate represents a reusable learner profile template.
type TargetAudienceTemplate struct {
	ID        uuid.UUID
	TenantID  uuid.UUID
	CompanyID uuid.UUID

	Name        string
	Description string

	// Profile attributes
	Role            string // Job role (e.g., "Sales Representative")
	ExperienceLevel valueobject.ExperienceLevel
	LearningGoals   []string // What they want to achieve
	Prerequisites   []string // Required prior knowledge
	Challenges      []string // Pain points they face
	Motivations     []string // Why they need to learn

	IndustryContext   *string // Industry-specific context
	TypicalBackground *string // Background description

	CreatedByUserID uuid.UUID
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
