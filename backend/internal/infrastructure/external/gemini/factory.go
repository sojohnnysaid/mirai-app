package gemini

import (
	"context"

	"github.com/google/uuid"

	"github.com/sogos/mirai-backend/internal/domain/service"
)

// SettingsProvider provides access to tenant AI settings for API key retrieval.
// This interface is implemented by TenantSettingsService.
type SettingsProvider interface {
	GetDecryptedAPIKey(ctx context.Context, tenantID uuid.UUID) (string, error)
}

// ProviderFactory creates AIProvider instances per-tenant.
// Since Gemini clients require API keys at construction time and keys are per-tenant,
// this factory creates a fresh client for each request using the tenant's decrypted API key.
type ProviderFactory struct {
	settingsProvider SettingsProvider
	logger           service.Logger
}

// NewProviderFactory creates a new ProviderFactory.
func NewProviderFactory(settingsProvider SettingsProvider, logger service.Logger) *ProviderFactory {
	return &ProviderFactory{
		settingsProvider: settingsProvider,
		logger:           logger,
	}
}

// GetProvider creates an AIProvider for the specified tenant.
// It retrieves the tenant's decrypted API key and creates a new Gemini client.
func (f *ProviderFactory) GetProvider(ctx context.Context, tenantID uuid.UUID) (service.AIProvider, error) {
	log := f.logger.With("tenantID", tenantID, "component", "gemini-factory")

	// Get the decrypted API key for this tenant
	apiKey, err := f.settingsProvider.GetDecryptedAPIKey(ctx, tenantID)
	if err != nil {
		log.Error("failed to get decrypted API key", "error", err)
		return nil, err
	}

	// Create a new Gemini client with the tenant's API key
	client, err := NewClient(ctx, apiKey)
	if err != nil {
		log.Error("failed to create Gemini client", "error", err)
		return nil, err
	}

	log.Debug("created Gemini provider for tenant")
	return client, nil
}
