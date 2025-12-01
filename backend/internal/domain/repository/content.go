package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/domain/entity"
)

// CourseRepository defines the interface for course metadata data access.
// Course content is stored separately in S3.
type CourseRepository interface {
	// Create creates a new course.
	Create(ctx context.Context, course *entity.Course) error

	// GetByID retrieves a course by its ID.
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Course, error)

	// Update updates a course.
	Update(ctx context.Context, course *entity.Course) error

	// Delete deletes a course.
	Delete(ctx context.Context, id uuid.UUID) error

	// List retrieves courses with optional filtering.
	List(ctx context.Context, opts entity.CourseListOptions) ([]*entity.Course, error)

	// CountByFolder counts courses in a folder.
	CountByFolder(ctx context.Context, folderID uuid.UUID) (int, error)
}

// FolderRepository defines the interface for folder data access.
type FolderRepository interface {
	// Create creates a new folder.
	Create(ctx context.Context, folder *entity.Folder) error

	// GetByID retrieves a folder by its ID.
	GetByID(ctx context.Context, id uuid.UUID) (*entity.Folder, error)

	// Update updates a folder.
	Update(ctx context.Context, folder *entity.Folder) error

	// Delete deletes a folder.
	Delete(ctx context.Context, id uuid.UUID) error

	// ListByParent retrieves all folders with a given parent.
	// Pass nil for parentID to get root folders.
	ListByParent(ctx context.Context, parentID *uuid.UUID) ([]*entity.Folder, error)

	// GetHierarchy retrieves all folders for building nested tree.
	GetHierarchy(ctx context.Context) ([]*entity.Folder, error)
}
