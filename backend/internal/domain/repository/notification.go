package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/domain/entity"
)

// NotificationRepository defines the interface for notification data access.
type NotificationRepository interface {
	// Create creates a new notification.
	Create(ctx context.Context, notification *entity.Notification) error

	// GetByID retrieves a notification by its ID.
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Notification, error)

	// List retrieves notifications for a user with optional filtering.
	List(ctx context.Context, userID uuid.UUID, opts entity.NotificationListOptions) ([]*entity.Notification, int, error)

	// GetUnreadCount returns the count of unread notifications.
	GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error)

	// MarkAsRead marks notifications as read.
	MarkAsRead(ctx context.Context, userID uuid.UUID, notificationIDs []uuid.UUID) (int, error)

	// MarkAllAsRead marks all notifications as read for a user.
	MarkAllAsRead(ctx context.Context, userID uuid.UUID) (int, error)

	// Delete deletes a notification.
	Delete(ctx context.Context, id uuid.UUID) error
}
