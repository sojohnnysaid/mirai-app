package config

import (
	"fmt"
	"os"
)

// Config holds application configuration
type Config struct {
	Port                   string
	DatabaseURL            string
	KratosURL              string
	AllowedOrigin          string
	StripeSecretKey        string
	StripeWebhookSecret    string
	StripeStarterPriceID   string
	StripeProPriceID       string
	FrontendURL            string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	port := getEnv("PORT", "8080")
	databaseURL := getEnv("DATABASE_URL", "")
	kratosURL := getEnv("KRATOS_URL", "http://kratos-public.kratos.svc.cluster.local")
	allowedOrigin := getEnv("ALLOWED_ORIGIN", "https://mirai.sogos.io")

	// Stripe configuration
	stripeSecretKey := getEnv("STRIPE_SECRET_KEY", "")
	stripeWebhookSecret := getEnv("STRIPE_WEBHOOK_SECRET", "")
	stripeStarterPriceID := getEnv("STRIPE_STARTER_PRICE_ID", "")
	stripeProPriceID := getEnv("STRIPE_PRO_PRICE_ID", "")
	frontendURL := getEnv("FRONTEND_URL", "https://mirai.sogos.io")

	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	return &Config{
		Port:                   port,
		DatabaseURL:            databaseURL,
		KratosURL:              kratosURL,
		AllowedOrigin:          allowedOrigin,
		StripeSecretKey:        stripeSecretKey,
		StripeWebhookSecret:    stripeWebhookSecret,
		StripeStarterPriceID:   stripeStarterPriceID,
		StripeProPriceID:       stripeProPriceID,
		FrontendURL:            frontendURL,
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
