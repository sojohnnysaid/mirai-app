package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sogos/mirai-backend/internal/config"
	"github.com/sogos/mirai-backend/internal/middleware"
	"github.com/sogos/mirai-backend/internal/models"
	"github.com/sogos/mirai-backend/internal/repository"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	billingportalsession "github.com/stripe/stripe-go/v76/billingportal/session"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/subscription"
	"github.com/stripe/stripe-go/v76/webhook"
)

// Price per seat in cents
const (
	starterPricePerSeatCents = 800  // $8.00 per seat
	proPricePerSeatCents     = 1200 // $12.00 per seat
)

// CheckoutRequest contains the plan to subscribe to
type CheckoutRequest struct {
	Plan string `json:"plan" binding:"required,oneof=starter pro"`
}

// BillingHandler handles billing-related requests
type BillingHandler struct {
	userRepo    *repository.UserRepository
	companyRepo *repository.CompanyRepository
	config      *config.Config
}

// NewBillingHandler creates a new billing handler
func NewBillingHandler(userRepo *repository.UserRepository, companyRepo *repository.CompanyRepository, cfg *config.Config) *BillingHandler {
	// Initialize Stripe with secret key
	stripe.Key = cfg.StripeSecretKey
	return &BillingHandler{
		userRepo:    userRepo,
		companyRepo: companyRepo,
		config:      cfg,
	}
}

// GetBilling handles GET /api/v1/billing
func (h *BillingHandler) GetBilling(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Get user and company
	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if user.CompanyID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user has no company"})
		return
	}

	company, err := h.companyRepo.GetByID(*user.CompanyID)
	if err != nil || company == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	// Count users in company for seat count
	seatCount, err := h.companyRepo.CountUsersByCompanyID(*user.CompanyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count users"})
		return
	}

	// Determine price per seat based on plan
	pricePerSeat := starterPricePerSeatCents
	if company.Plan == "pro" {
		pricePerSeat = proPricePerSeatCents
	}

	// Build billing info
	billingInfo := models.BillingInfo{
		Plan:              company.Plan,
		Status:            company.SubscriptionStatus,
		SeatCount:         seatCount,
		PricePerSeat:      pricePerSeat,
		CancelAtPeriodEnd: false,
	}

	// If there's an active subscription, get more details from Stripe
	if company.StripeSubscriptionID != nil && *company.StripeSubscriptionID != "" {
		sub, err := subscription.Get(*company.StripeSubscriptionID, nil)
		if err == nil {
			billingInfo.CancelAtPeriodEnd = sub.CancelAtPeriodEnd
			periodEnd := sub.CurrentPeriodEnd
			billingInfo.CurrentPeriodEnd = &periodEnd
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    billingInfo,
	})
}

// CreateCheckoutSession handles POST /api/v1/billing/checkout
func (h *BillingHandler) CreateCheckoutSession(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Parse request body
	var req CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "plan is required (starter or pro)"})
		return
	}

	// Get user and company
	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if user.CompanyID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user has no company"})
		return
	}

	// Only owners can manage billing
	if user.Role != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only company owners can manage billing"})
		return
	}

	company, err := h.companyRepo.GetByID(*user.CompanyID)
	if err != nil || company == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	// Determine price ID based on requested plan
	var priceID string
	switch req.Plan {
	case "starter":
		priceID = h.config.StripeStarterPriceID
	case "pro":
		priceID = h.config.StripeProPriceID
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid plan"})
		return
	}

	if priceID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "price not configured for this plan"})
		return
	}

	// Count users for seat quantity
	seatCount, err := h.companyRepo.CountUsersByCompanyID(*user.CompanyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count users"})
		return
	}
	if seatCount < 1 {
		seatCount = 1 // Minimum 1 seat
	}

	// Get or create Stripe customer
	var stripeCustomerID string
	if company.StripeCustomerID != nil && *company.StripeCustomerID != "" {
		stripeCustomerID = *company.StripeCustomerID
	} else {
		// Get user email from Kratos context
		email := middleware.GetEmail(c)
		if email == "" {
			email = "customer@example.com" // Fallback
		}

		// Create new Stripe customer
		customerParams := &stripe.CustomerParams{
			Email: stripe.String(email),
			Name:  stripe.String(company.Name),
			Metadata: map[string]string{
				"company_id": company.ID.String(),
			},
		}
		newCustomer, err := customer.New(customerParams)
		if err != nil {
			log.Printf("Failed to create Stripe customer: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create customer"})
			return
		}
		stripeCustomerID = newCustomer.ID

		// Save customer ID to company
		if err := h.companyRepo.UpdateStripeFields(company.ID, &stripeCustomerID, nil, company.SubscriptionStatus, company.Plan); err != nil {
			log.Printf("Failed to save stripe customer ID: %v", err)
		}
	}

	// Create checkout session
	checkoutParams := &stripe.CheckoutSessionParams{
		Customer: stripe.String(stripeCustomerID),
		Mode:     stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(int64(seatCount)),
			},
		},
		SuccessURL: stripe.String(h.config.FrontendURL + "/settings?tab=billing&checkout=success"),
		CancelURL:  stripe.String(h.config.FrontendURL + "/settings?tab=billing&checkout=canceled"),
		Metadata: map[string]string{
			"company_id": company.ID.String(),
			"plan":       req.Plan,
		},
		SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
			Metadata: map[string]string{
				"company_id": company.ID.String(),
				"plan":       req.Plan,
			},
		},
	}

	sess, err := session.New(checkoutParams)
	if err != nil {
		log.Printf("Failed to create checkout session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create checkout session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    models.CheckoutResponse{URL: sess.URL},
	})
}

// CreatePortalSession handles POST /api/v1/billing/portal
func (h *BillingHandler) CreatePortalSession(c *gin.Context) {
	kratosID, err := middleware.GetKratosID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Get user and company
	user, err := h.userRepo.GetByKratosID(kratosID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if user.CompanyID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user has no company"})
		return
	}

	// Only owners can access billing portal
	if user.Role != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only company owners can access billing"})
		return
	}

	company, err := h.companyRepo.GetByID(*user.CompanyID)
	if err != nil || company == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	if company.StripeCustomerID == nil || *company.StripeCustomerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no billing account found"})
		return
	}

	// Create portal session
	portalParams := &stripe.BillingPortalSessionParams{
		Customer:  company.StripeCustomerID,
		ReturnURL: stripe.String(h.config.FrontendURL + "/settings?tab=billing"),
	}

	portalSession, err := billingportalsession.New(portalParams)
	if err != nil {
		log.Printf("Failed to create portal session: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create portal session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    models.PortalResponse{URL: portalSession.URL},
	})
}

// HandleWebhook handles POST /api/v1/webhooks/stripe
func (h *BillingHandler) HandleWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Failed to read webhook body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	// Verify webhook signature (ignore API version mismatch for Stripe CLI compatibility)
	sigHeader := c.GetHeader("Stripe-Signature")
	event, err := webhook.ConstructEventWithOptions(payload, sigHeader, h.config.StripeWebhookSecret, webhook.ConstructEventOptions{
		IgnoreAPIVersionMismatch: true,
	})
	if err != nil {
		log.Printf("Webhook signature verification failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid signature"})
		return
	}

	// Handle the event
	switch event.Type {
	case "checkout.session.completed":
		var checkoutSession stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &checkoutSession); err != nil {
			log.Printf("Failed to unmarshal checkout session: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		h.handleCheckoutCompleted(&checkoutSession)

	case "customer.subscription.updated":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			log.Printf("Failed to unmarshal subscription: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		h.handleSubscriptionUpdated(&sub)

	case "customer.subscription.deleted":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			log.Printf("Failed to unmarshal subscription: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}
		h.handleSubscriptionDeleted(&sub)

	default:
		log.Printf("Unhandled event type: %s", event.Type)
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

func (h *BillingHandler) handleCheckoutCompleted(checkoutSession *stripe.CheckoutSession) {
	// Get company ID from metadata
	companyIDStr, ok := checkoutSession.Metadata["company_id"]
	if !ok {
		log.Printf("No company_id in checkout session metadata")
		return
	}

	companyID, err := uuid.Parse(companyIDStr)
	if err != nil {
		log.Printf("Invalid company_id in metadata: %v", err)
		return
	}

	// Get plan from metadata (defaults to starter if not set)
	plan := checkoutSession.Metadata["plan"]
	if plan == "" {
		plan = "starter"
	}

	// Get the subscription ID
	subscriptionID := ""
	if checkoutSession.Subscription != nil {
		subscriptionID = checkoutSession.Subscription.ID
	}

	// Update company with Stripe info
	stripeCustomerID := checkoutSession.Customer.ID
	err = h.companyRepo.UpdateStripeFields(
		companyID,
		&stripeCustomerID,
		&subscriptionID,
		"active",
		plan,
	)
	if err != nil {
		log.Printf("Failed to update company stripe fields: %v", err)
		return
	}

	log.Printf("Checkout completed for company %s with plan %s", companyID, plan)
}

func (h *BillingHandler) handleSubscriptionUpdated(sub *stripe.Subscription) {
	// Get company by Stripe customer ID
	company, err := h.companyRepo.GetByStripeCustomerID(sub.Customer.ID)
	if err != nil || company == nil {
		log.Printf("Company not found for customer %s: %v", sub.Customer.ID, err)
		return
	}

	// Map Stripe status to our status
	status := mapStripeStatus(sub.Status)

	// Get plan from subscription metadata, or keep current plan
	plan := company.Plan
	if sub.Metadata != nil {
		if metaPlan, ok := sub.Metadata["plan"]; ok && metaPlan != "" {
			plan = metaPlan
		}
	}

	// If subscription is canceled, you can optionally downgrade
	// For now we keep their plan but mark status as canceled
	if sub.Status == stripe.SubscriptionStatusCanceled {
		status = "canceled"
	}

	subID := sub.ID
	customerID := sub.Customer.ID
	err = h.companyRepo.UpdateStripeFields(company.ID, &customerID, &subID, status, plan)
	if err != nil {
		log.Printf("Failed to update subscription: %v", err)
		return
	}

	log.Printf("Subscription updated for company %s: status=%s, plan=%s", company.ID, status, plan)
}

func (h *BillingHandler) handleSubscriptionDeleted(sub *stripe.Subscription) {
	// Get company by Stripe customer ID
	company, err := h.companyRepo.GetByStripeCustomerID(sub.Customer.ID)
	if err != nil || company == nil {
		log.Printf("Company not found for customer %s: %v", sub.Customer.ID, err)
		return
	}

	// Reset to starter plan
	customerID := sub.Customer.ID
	err = h.companyRepo.UpdateStripeFields(company.ID, &customerID, nil, "canceled", "starter")
	if err != nil {
		log.Printf("Failed to handle subscription deletion: %v", err)
		return
	}

	log.Printf("Subscription deleted for company %s, reverted to starter", company.ID)
}

func mapStripeStatus(status stripe.SubscriptionStatus) string {
	switch status {
	case stripe.SubscriptionStatusActive:
		return "active"
	case stripe.SubscriptionStatusPastDue:
		return "past_due"
	case stripe.SubscriptionStatusCanceled:
		return "canceled"
	case stripe.SubscriptionStatusUnpaid:
		return "past_due"
	default:
		return "none"
	}
}

// UpdateSeatCount updates the Stripe subscription quantity when users are added/removed
func (h *BillingHandler) UpdateSeatCount(companyID uuid.UUID, newCount int) error {
	company, err := h.companyRepo.GetByID(companyID)
	if err != nil || company == nil {
		return err
	}

	// Only update if there's an active subscription
	if company.StripeSubscriptionID == nil || *company.StripeSubscriptionID == "" {
		return nil
	}

	// Get the subscription to find the subscription item ID
	sub, err := subscription.Get(*company.StripeSubscriptionID, nil)
	if err != nil {
		return err
	}

	// Update the quantity on the first item (assumes single price subscription)
	if len(sub.Items.Data) > 0 {
		itemID := sub.Items.Data[0].ID
		updateParams := &stripe.SubscriptionParams{
			Items: []*stripe.SubscriptionItemsParams{
				{
					ID:       stripe.String(itemID),
					Quantity: stripe.Int64(int64(newCount)),
				},
			},
			ProrationBehavior: stripe.String("create_prorations"),
		}
		_, err = subscription.Update(*company.StripeSubscriptionID, updateParams)
		if err != nil {
			log.Printf("Failed to update seat count: %v", err)
			return err
		}
		log.Printf("Updated seat count for company %s to %d", companyID, newCount)
	}

	return nil
}
