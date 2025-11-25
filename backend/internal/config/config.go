package config

import (
	"fmt"
	"os"
)

// Config holds application configuration
type Config struct {
	Port          string
	DatabaseURL   string
	KratosURL     string
	AllowedOrigin string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	port := getEnv("PORT", "8080")
	databaseURL := getEnv("DATABASE_URL", "")
	kratosURL := getEnv("KRATOS_URL", "http://kratos-public.kratos.svc.cluster.local")
	allowedOrigin := getEnv("ALLOWED_ORIGIN", "https://mirai.sogos.io")

	if databaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}

	return &Config{
		Port:          port,
		DatabaseURL:   databaseURL,
		KratosURL:     kratosURL,
		AllowedOrigin: allowedOrigin,
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
