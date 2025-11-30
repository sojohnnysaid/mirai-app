package service

import (
	"context"
	"time"

	"github.com/sogos/mirai-backend/internal/domain/repository"
	"github.com/sogos/mirai-backend/internal/domain/service"
)

// CleanupService handles cleanup of expired pending registrations.
type CleanupService struct {
	pendingRegRepo repository.PendingRegistrationRepository
	logger         service.Logger
}

// NewCleanupService creates a new cleanup service.
func NewCleanupService(
	pendingRegRepo repository.PendingRegistrationRepository,
	logger service.Logger,
) *CleanupService {
	return &CleanupService{
		pendingRegRepo: pendingRegRepo,
		logger:         logger,
	}
}

// CleanupExpired removes all expired pending registrations.
// This should be called periodically (e.g., every hour) by a background job.
func (s *CleanupService) CleanupExpired(ctx context.Context) error {
	log := s.logger.With("job", "cleanup")

	deleted, err := s.pendingRegRepo.DeleteExpired(ctx)
	if err != nil {
		log.Error("failed to delete expired registrations", "error", err)
		return err
	}

	if deleted > 0 {
		log.Info("deleted expired pending registrations", "count", deleted)
	}

	return nil
}

// RunBackground starts the background cleanup loop.
// This should be called as a goroutine.
func (s *CleanupService) RunBackground(ctx context.Context, interval time.Duration) {
	log := s.logger.With("job", "cleanup-loop")
	log.Info("starting cleanup background job", "interval", interval)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Run immediately on start
	if err := s.CleanupExpired(ctx); err != nil {
		log.Error("initial cleanup error", "error", err)
	}

	for {
		select {
		case <-ctx.Done():
			log.Info("cleanup background job stopped")
			return
		case <-ticker.C:
			if err := s.CleanupExpired(ctx); err != nil {
				log.Error("cleanup job error", "error", err)
			}
		}
	}
}
