package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sogos/mirai-backend/internal/middleware"
	"github.com/sogos/mirai-backend/internal/repository"
)

// CompanyHandler handles company-related requests
type CompanyHandler struct {
	userRepo    *repository.UserRepository
	companyRepo *repository.CompanyRepository
}

// NewCompanyHandler creates a new company handler
func NewCompanyHandler(userRepo *repository.UserRepository, companyRepo *repository.CompanyRepository) *CompanyHandler {
	return &CompanyHandler{
		userRepo:    userRepo,
		companyRepo: companyRepo,
	}
}

// GetCompany handles GET /api/v1/company
func (h *CompanyHandler) GetCompany(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if user == nil || user.CompanyID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user has no company"})
		return
	}

	company, err := h.companyRepo.GetByID(*user.CompanyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get company"})
		return
	}
	if company == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	c.JSON(http.StatusOK, company)
}

// UpdateCompany handles PUT /api/v1/company
func (h *CompanyHandler) UpdateCompany(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if user == nil || user.CompanyID == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user has no company"})
		return
	}

	// Only owners and admins can update company
	if user.Role != "owner" && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	company, err := h.companyRepo.GetByID(*user.CompanyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get company"})
		return
	}
	if company == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	// Parse partial update
	var req struct {
		Name string `json:"name,omitempty"`
		Plan string `json:"plan,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields if provided
	if req.Name != "" {
		company.Name = req.Name
	}
	if req.Plan != "" {
		company.Plan = req.Plan
	}

	if err := h.companyRepo.Update(company); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update company"})
		return
	}

	c.JSON(http.StatusOK, company)
}
