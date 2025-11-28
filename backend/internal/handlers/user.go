package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sogos/mirai-backend/internal/config"
	"github.com/sogos/mirai-backend/internal/middleware"
	"github.com/sogos/mirai-backend/internal/models"
	"github.com/sogos/mirai-backend/internal/repository"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/customer"
)

// UserHandler handles user-related requests
type UserHandler struct {
	userRepo    *repository.UserRepository
	companyRepo *repository.CompanyRepository
	config      *config.Config
}

// NewUserHandler creates a new user handler
func NewUserHandler(userRepo *repository.UserRepository, companyRepo *repository.CompanyRepository, cfg *config.Config) *UserHandler {
	return &UserHandler{
		userRepo:    userRepo,
		companyRepo: companyRepo,
		config:      cfg,
	}
}

// GetMe handles GET /api/v1/me
func (h *UserHandler) GetMe(c *gin.Context) {
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

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	response := models.UserWithCompany{
		User: *user,
	}

	// Get company if user belongs to one
	if user.CompanyID != nil {
		company, err := h.companyRepo.GetByID(*user.CompanyID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get company"})
			return
		}
		response.Company = company
	}

	c.JSON(http.StatusOK, response)
}

// Onboard handles POST /api/v1/onboard
func (h *UserHandler) Onboard(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Check if user already exists
	existingUser, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check user"})
		return
	}
	if existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "user already onboarded"})
		return
	}

	// Parse request body
	var req models.OnboardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create company with org info
	var industry, teamSize *string
	if req.Industry != "" {
		industry = &req.Industry
	}
	if req.TeamSize != "" {
		teamSize = &req.TeamSize
	}

	company := &models.Company{
		Name:     req.CompanyName,
		Industry: industry,
		TeamSize: teamSize,
		Plan:     req.Plan,
	}
	if err := h.companyRepo.Create(company); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create company"})
		return
	}

	// Create user as owner
	user := &models.User{
		KratosID:  kratosID,
		CompanyID: &company.ID,
		Role:      "owner",
	}
	if err := h.userRepo.Create(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	response := models.OnboardResponse{
		User:    *user,
		Company: company,
	}

	// For non-enterprise plans, create Stripe checkout session
	if req.Plan != "enterprise" {
		checkoutURL, err := h.createCheckoutSession(c, company, req.Plan, req.SeatCount)
		if err != nil {
			log.Printf("Failed to create checkout session: %v", err)
			// Don't fail the entire onboard - just log and continue
		} else {
			response.CheckoutURL = checkoutURL
		}
	}

	c.JSON(http.StatusCreated, response)
}

// createCheckoutSession creates a Stripe checkout session for the new company
func (h *UserHandler) createCheckoutSession(c *gin.Context, company *models.Company, plan string, seatCount int) (string, error) {
	// Determine price ID based on plan
	var priceID string
	switch plan {
	case "starter":
		priceID = h.config.StripeStarterPriceID
	case "pro":
		priceID = h.config.StripeProPriceID
	default:
		return "", nil // Enterprise doesn't use checkout
	}

	if priceID == "" {
		log.Printf("No price ID configured for plan: %s", plan)
		return "", nil
	}

	// Use minimum 1 seat
	if seatCount < 1 {
		seatCount = 1
	}

	// Get user email from Kratos context
	email := middleware.GetEmail(c)
	if email == "" {
		email = "customer@example.com" // Fallback
	}

	// Create Stripe customer
	customerParams := &stripe.CustomerParams{
		Email: stripe.String(email),
		Name:  stripe.String(company.Name),
		Metadata: map[string]string{
			"company_id": company.ID.String(),
		},
	}
	newCustomer, err := customer.New(customerParams)
	if err != nil {
		return "", err
	}

	// Save customer ID to company
	if err := h.companyRepo.UpdateStripeFields(company.ID, &newCustomer.ID, nil, company.SubscriptionStatus, company.Plan); err != nil {
		log.Printf("Failed to save stripe customer ID: %v", err)
	}

	// Create checkout session
	checkoutParams := &stripe.CheckoutSessionParams{
		Customer: stripe.String(newCustomer.ID),
		Mode:     stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(int64(seatCount)),
			},
		},
		SuccessURL: stripe.String(h.config.FrontendURL + "/dashboard?checkout=success"),
		CancelURL:  stripe.String(h.config.FrontendURL + "/auth/signup?step=4&checkout=canceled"),
		Metadata: map[string]string{
			"company_id": company.ID.String(),
			"plan":       plan,
		},
		SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
			Metadata: map[string]string{
				"company_id": company.ID.String(),
				"plan":       plan,
			},
		},
	}

	sess, err := session.New(checkoutParams)
	if err != nil {
		return "", err
	}

	return sess.URL, nil
}
