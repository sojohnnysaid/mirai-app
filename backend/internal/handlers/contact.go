package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sogos/mirai-backend/internal/models"
)

// ContactHandler handles contact-related requests
type ContactHandler struct {
	// Future: add email service for notifications
}

// NewContactHandler creates a new contact handler
func NewContactHandler() *ContactHandler {
	return &ContactHandler{}
}

// EnterpriseContact handles POST /api/v1/contact/enterprise
func (h *ContactHandler) EnterpriseContact(c *gin.Context) {
	var req models.EnterpriseContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log the enterprise inquiry for now
	// TODO: Send email notification to sales team
	log.Printf("Enterprise inquiry from %s (%s) at %s - Team size: %s, Industry: %s",
		req.Name, req.Email, req.CompanyName, req.TeamSize, req.Industry)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Thank you for your interest. Our team will contact you within 24 hours.",
	})
}
