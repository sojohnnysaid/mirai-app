package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/domain/entity"
	domainerrors "github.com/sogos/mirai-backend/internal/domain/errors"
	"github.com/sogos/mirai-backend/internal/domain/repository"
	"github.com/sogos/mirai-backend/internal/domain/service"
	"github.com/sogos/mirai-backend/internal/domain/valueobject"
)

// TargetAudienceService handles target audience template management.
type TargetAudienceService struct {
	userRepo     repository.UserRepository
	audienceRepo repository.TargetAudienceRepository
	logger       service.Logger
}

// NewTargetAudienceService creates a new target audience service.
func NewTargetAudienceService(
	userRepo repository.UserRepository,
	audienceRepo repository.TargetAudienceRepository,
	logger service.Logger,
) *TargetAudienceService {
	return &TargetAudienceService{
		userRepo:     userRepo,
		audienceRepo: audienceRepo,
		logger:       logger,
	}
}

// CreateTargetAudienceRequest contains the parameters for creating a target audience.
type CreateTargetAudienceRequest struct {
	Name              string
	Description       string
	Role              string
	ExperienceLevel   valueobject.ExperienceLevel
	LearningGoals     []string
	Prerequisites     []string
	Challenges        []string
	Motivations       []string
	IndustryContext   *string
	TypicalBackground *string
}

// CreateTargetAudience creates a new target audience template.
func (s *TargetAudienceService) CreateTargetAudience(ctx context.Context, kratosID uuid.UUID, req CreateTargetAudienceRequest) (*entity.TargetAudienceTemplate, error) {
	log := s.logger.With("kratosID", kratosID, "audienceName", req.Name)

	user, err := s.userRepo.GetByKratosID(ctx, kratosID)
	if err != nil || user == nil {
		return nil, domainerrors.ErrUserNotFound
	}

	if user.TenantID == nil || user.CompanyID == nil {
		return nil, domainerrors.ErrUserHasNoCompany
	}

	audience := &entity.TargetAudienceTemplate{
		TenantID:          *user.TenantID,
		CompanyID:         *user.CompanyID,
		Name:              req.Name,
		Description:       req.Description,
		Role:              req.Role,
		ExperienceLevel:   req.ExperienceLevel,
		LearningGoals:     req.LearningGoals,
		Prerequisites:     req.Prerequisites,
		Challenges:        req.Challenges,
		Motivations:       req.Motivations,
		IndustryContext:   req.IndustryContext,
		TypicalBackground: req.TypicalBackground,
		Status:            valueobject.TargetAudienceStatusActive,
		CreatedByUserID:   user.ID,
	}

	if err := s.audienceRepo.Create(ctx, audience); err != nil {
		log.Error("failed to create target audience", "error", err)
		return nil, domainerrors.ErrInternal.WithCause(err)
	}

	log.Info("target audience created", "audienceID", audience.ID)
	return audience, nil
}

// GetTargetAudience retrieves a target audience by ID.
func (s *TargetAudienceService) GetTargetAudience(ctx context.Context, kratosID uuid.UUID, audienceID uuid.UUID) (*entity.TargetAudienceTemplate, error) {
	user, err := s.userRepo.GetByKratosID(ctx, kratosID)
	if err != nil || user == nil {
		return nil, domainerrors.ErrUserNotFound
	}

	audience, err := s.audienceRepo.GetByID(ctx, audienceID)
	if err != nil || audience == nil {
		return nil, domainerrors.ErrTargetAudienceNotFound
	}

	// Verify company access
	if user.CompanyID == nil || audience.CompanyID != *user.CompanyID {
		return nil, domainerrors.ErrForbidden
	}

	return audience, nil
}

// ListTargetAudiencesOptions contains options for listing target audiences.
type ListTargetAudiencesOptions struct {
	IncludeArchived bool
}

// ListTargetAudiences retrieves all target audiences for the user's company.
func (s *TargetAudienceService) ListTargetAudiences(ctx context.Context, kratosID uuid.UUID, opts *ListTargetAudiencesOptions) ([]*entity.TargetAudienceTemplate, error) {
	user, err := s.userRepo.GetByKratosID(ctx, kratosID)
	if err != nil || user == nil {
		return nil, domainerrors.ErrUserNotFound
	}

	if user.CompanyID == nil {
		return nil, domainerrors.ErrUserHasNoCompany
	}

	// List uses RLS to filter by tenant
	audiences, err := s.audienceRepo.List(ctx)
	if err != nil {
		s.logger.Error("failed to list target audiences", "error", err)
		return nil, domainerrors.ErrInternal.WithCause(err)
	}

	// Filter out archived unless requested
	if opts == nil || !opts.IncludeArchived {
		filtered := make([]*entity.TargetAudienceTemplate, 0, len(audiences))
		for _, a := range audiences {
			if a.Status != valueobject.TargetAudienceStatusArchived {
				filtered = append(filtered, a)
			}
		}
		audiences = filtered
	}

	return audiences, nil
}

// UpdateTargetAudienceRequest contains the parameters for updating a target audience.
type UpdateTargetAudienceRequest struct {
	Name              *string
	Description       *string
	Role              *string
	ExperienceLevel   *valueobject.ExperienceLevel
	LearningGoals     []string
	Prerequisites     []string
	Challenges        []string
	Motivations       []string
	IndustryContext   *string
	TypicalBackground *string
}

// UpdateTargetAudience updates a target audience template.
func (s *TargetAudienceService) UpdateTargetAudience(ctx context.Context, kratosID uuid.UUID, audienceID uuid.UUID, req UpdateTargetAudienceRequest) (*entity.TargetAudienceTemplate, error) {
	log := s.logger.With("kratosID", kratosID, "audienceID", audienceID)

	user, err := s.userRepo.GetByKratosID(ctx, kratosID)
	if err != nil || user == nil {
		return nil, domainerrors.ErrUserNotFound
	}

	audience, err := s.audienceRepo.GetByID(ctx, audienceID)
	if err != nil || audience == nil {
		return nil, domainerrors.ErrTargetAudienceNotFound
	}

	// Verify company access
	if user.CompanyID == nil || audience.CompanyID != *user.CompanyID {
		return nil, domainerrors.ErrForbidden
	}

	// Apply updates
	if req.Name != nil {
		audience.Name = *req.Name
	}
	if req.Description != nil {
		audience.Description = *req.Description
	}
	if req.Role != nil {
		audience.Role = *req.Role
	}
	if req.ExperienceLevel != nil {
		audience.ExperienceLevel = *req.ExperienceLevel
	}
	if req.LearningGoals != nil {
		audience.LearningGoals = req.LearningGoals
	}
	if req.Prerequisites != nil {
		audience.Prerequisites = req.Prerequisites
	}
	if req.Challenges != nil {
		audience.Challenges = req.Challenges
	}
	if req.Motivations != nil {
		audience.Motivations = req.Motivations
	}
	if req.IndustryContext != nil {
		audience.IndustryContext = req.IndustryContext
	}
	if req.TypicalBackground != nil {
		audience.TypicalBackground = req.TypicalBackground
	}

	if err := s.audienceRepo.Update(ctx, audience); err != nil {
		log.Error("failed to update target audience", "error", err)
		return nil, domainerrors.ErrInternal.WithCause(err)
	}

	log.Info("target audience updated")
	return audience, nil
}

// DeleteTargetAudience archives a target audience template (soft delete).
func (s *TargetAudienceService) DeleteTargetAudience(ctx context.Context, kratosID uuid.UUID, audienceID uuid.UUID) error {
	log := s.logger.With("kratosID", kratosID, "audienceID", audienceID)

	user, err := s.userRepo.GetByKratosID(ctx, kratosID)
	if err != nil || user == nil {
		return domainerrors.ErrUserNotFound
	}

	audience, err := s.audienceRepo.GetByID(ctx, audienceID)
	if err != nil || audience == nil {
		return domainerrors.ErrTargetAudienceNotFound
	}

	// Verify company access
	if user.CompanyID == nil || audience.CompanyID != *user.CompanyID {
		return domainerrors.ErrForbidden
	}

	// Soft delete by setting status to archived
	audience.Status = valueobject.TargetAudienceStatusArchived
	if err := s.audienceRepo.Update(ctx, audience); err != nil {
		log.Error("failed to archive target audience", "error", err)
		return domainerrors.ErrInternal.WithCause(err)
	}

	log.Info("target audience archived")
	return nil
}

// ArchiveTargetAudience archives a target audience template.
func (s *TargetAudienceService) ArchiveTargetAudience(ctx context.Context, kratosID uuid.UUID, audienceID uuid.UUID) (*entity.TargetAudienceTemplate, error) {
	log := s.logger.With("kratosID", kratosID, "audienceID", audienceID)

	user, err := s.userRepo.GetByKratosID(ctx, kratosID)
	if err != nil || user == nil {
		return nil, domainerrors.ErrUserNotFound
	}

	audience, err := s.audienceRepo.GetByID(ctx, audienceID)
	if err != nil || audience == nil {
		return nil, domainerrors.ErrTargetAudienceNotFound
	}

	// Verify company access
	if user.CompanyID == nil || audience.CompanyID != *user.CompanyID {
		return nil, domainerrors.ErrForbidden
	}

	audience.Status = valueobject.TargetAudienceStatusArchived
	if err := s.audienceRepo.Update(ctx, audience); err != nil {
		log.Error("failed to archive target audience", "error", err)
		return nil, domainerrors.ErrInternal.WithCause(err)
	}

	log.Info("target audience archived")
	return audience, nil
}

// RestoreTargetAudience restores an archived target audience template.
func (s *TargetAudienceService) RestoreTargetAudience(ctx context.Context, kratosID uuid.UUID, audienceID uuid.UUID) (*entity.TargetAudienceTemplate, error) {
	log := s.logger.With("kratosID", kratosID, "audienceID", audienceID)

	user, err := s.userRepo.GetByKratosID(ctx, kratosID)
	if err != nil || user == nil {
		return nil, domainerrors.ErrUserNotFound
	}

	audience, err := s.audienceRepo.GetByID(ctx, audienceID)
	if err != nil || audience == nil {
		return nil, domainerrors.ErrTargetAudienceNotFound
	}

	// Verify company access
	if user.CompanyID == nil || audience.CompanyID != *user.CompanyID {
		return nil, domainerrors.ErrForbidden
	}

	if audience.Status != valueobject.TargetAudienceStatusArchived {
		return nil, domainerrors.ErrBadRequest.WithMessage("target audience is not archived")
	}

	audience.Status = valueobject.TargetAudienceStatusActive
	if err := s.audienceRepo.Update(ctx, audience); err != nil {
		log.Error("failed to restore target audience", "error", err)
		return nil, domainerrors.ErrInternal.WithCause(err)
	}

	log.Info("target audience restored")
	return audience, nil
}
