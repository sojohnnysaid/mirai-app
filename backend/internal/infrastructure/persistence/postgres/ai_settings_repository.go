package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/domain/entity"
	"github.com/sogos/mirai-backend/internal/domain/repository"
	"github.com/sogos/mirai-backend/internal/domain/valueobject"
)

// TenantAISettingsRepository implements repository.TenantAISettingsRepository using PostgreSQL.
type TenantAISettingsRepository struct {
	db *sql.DB
}

// NewTenantAISettingsRepository creates a new PostgreSQL tenant AI settings repository.
func NewTenantAISettingsRepository(db *sql.DB) repository.TenantAISettingsRepository {
	return &TenantAISettingsRepository{db: db}
}

// Get retrieves AI settings for a tenant.
// Returns (nil, nil) if settings don't exist yet.
func (r *TenantAISettingsRepository) Get(ctx context.Context, tenantID uuid.UUID) (*entity.TenantAISettings, error) {
	return RLSQuery(ctx, r.db, func(tx *sql.Tx) (*entity.TenantAISettings, error) {
		query := `
			SELECT id, tenant_id, provider, encrypted_api_key, total_tokens_used, monthly_token_limit, updated_at, updated_by_user_id
			FROM tenant_ai_settings
			WHERE tenant_id = $1
		`
		settings := &entity.TenantAISettings{}
		var providerStr string
		err := tx.QueryRowContext(ctx, query, tenantID).Scan(
			&settings.ID,
			&settings.TenantID,
			&providerStr,
			&settings.EncryptedAPIKey,
			&settings.TotalTokensUsed,
			&settings.MonthlyTokenLimit,
			&settings.UpdatedAt,
			&settings.UpdatedByUserID,
		)
		if err == sql.ErrNoRows {
			return nil, nil // No settings exist yet
		}
		if err != nil {
			return nil, fmt.Errorf("failed to get AI settings: %w", err)
		}
		settings.Provider, _ = valueobject.ParseAIProvider(providerStr)
		return settings, nil
	})
}

// Create creates new AI settings for a tenant.
func (r *TenantAISettingsRepository) Create(ctx context.Context, settings *entity.TenantAISettings) error {
	return RLSExec(ctx, r.db, func(tx *sql.Tx) error {
		query := `
			INSERT INTO tenant_ai_settings (tenant_id, provider, encrypted_api_key, monthly_token_limit, updated_by_user_id)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id, total_tokens_used, updated_at
		`
		return tx.QueryRowContext(ctx, query,
			settings.TenantID,
			settings.Provider.String(),
			settings.EncryptedAPIKey,
			settings.MonthlyTokenLimit,
			settings.UpdatedByUserID,
		).Scan(&settings.ID, &settings.TotalTokensUsed, &settings.UpdatedAt)
	})
}

// Update updates AI settings.
func (r *TenantAISettingsRepository) Update(ctx context.Context, settings *entity.TenantAISettings) error {
	return RLSExec(ctx, r.db, func(tx *sql.Tx) error {
		query := `
			UPDATE tenant_ai_settings
			SET provider = $1, encrypted_api_key = $2, monthly_token_limit = $3, updated_at = NOW(), updated_by_user_id = $4
			WHERE tenant_id = $5
			RETURNING updated_at
		`
		return tx.QueryRowContext(ctx, query,
			settings.Provider.String(),
			settings.EncryptedAPIKey,
			settings.MonthlyTokenLimit,
			settings.UpdatedByUserID,
			settings.TenantID,
		).Scan(&settings.UpdatedAt)
	})
}

// IncrementTokenUsage increments the token usage counter.
func (r *TenantAISettingsRepository) IncrementTokenUsage(ctx context.Context, tenantID uuid.UUID, tokens int64) error {
	return RLSExec(ctx, r.db, func(tx *sql.Tx) error {
		query := `
			UPDATE tenant_ai_settings
			SET total_tokens_used = total_tokens_used + $1, updated_at = NOW()
			WHERE tenant_id = $2
		`
		_, err := tx.ExecContext(ctx, query, tokens, tenantID)
		return err
	})
}
