package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/sogos/mirai-backend/internal/config"
	"github.com/sogos/mirai-backend/internal/database"
	"github.com/sogos/mirai-backend/internal/handlers"
	"github.com/sogos/mirai-backend/internal/middleware"
	"github.com/sogos/mirai-backend/internal/repository"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := database.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db.DB)
	companyRepo := repository.NewCompanyRepository(db.DB)
	teamRepo := repository.NewTeamRepository(db.DB)

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler()
	userHandler := handlers.NewUserHandler(userRepo, companyRepo)
	companyHandler := handlers.NewCompanyHandler(userRepo, companyRepo)
	teamHandler := handlers.NewTeamHandler(userRepo, teamRepo)
	billingHandler := handlers.NewBillingHandler(userRepo, companyRepo, cfg)

	// Set up Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", cfg.AllowedOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Public routes
	r.GET("/health", healthHandler.Check)

	// Protected API routes
	api := r.Group("/api/v1")
	api.Use(middleware.KratosAuth(cfg.KratosURL))
	{
		// User routes
		api.GET("/me", userHandler.GetMe)
		api.POST("/onboard", userHandler.Onboard)

		// Company routes
		api.GET("/company", companyHandler.GetCompany)
		api.PUT("/company", companyHandler.UpdateCompany)

		// Team routes
		api.GET("/teams", teamHandler.ListTeams)
		api.POST("/teams", teamHandler.CreateTeam)
		api.GET("/teams/:id", teamHandler.GetTeam)
		api.PUT("/teams/:id", teamHandler.UpdateTeam)
		api.DELETE("/teams/:id", teamHandler.DeleteTeam)

		// Team member routes
		api.GET("/teams/:id/members", teamHandler.ListTeamMembers)
		api.POST("/teams/:id/members", teamHandler.AddTeamMember)
		api.DELETE("/teams/:id/members/:uid", teamHandler.RemoveTeamMember)

		// Billing routes
		api.GET("/billing", billingHandler.GetBilling)
		api.POST("/billing/checkout", billingHandler.CreateCheckoutSession)
		api.POST("/billing/portal", billingHandler.CreatePortalSession)
	}

	// Stripe webhook route (no auth - uses signature verification)
	r.POST("/api/v1/webhooks/stripe", billingHandler.HandleWebhook)

	// Start server
	log.Printf("Starting server on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
