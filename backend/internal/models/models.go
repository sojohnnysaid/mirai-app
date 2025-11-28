package models

import (
	"time"

	"github.com/google/uuid"
)

// Company represents an organization in the system
type Company struct {
	ID                   uuid.UUID `json:"id" db:"id"`
	Name                 string    `json:"name" db:"name"`
	Plan                 string    `json:"plan" db:"plan"` // starter, pro, enterprise
	StripeCustomerID     *string   `json:"stripe_customer_id,omitempty" db:"stripe_customer_id"`
	StripeSubscriptionID *string   `json:"stripe_subscription_id,omitempty" db:"stripe_subscription_id"`
	SubscriptionStatus   string    `json:"subscription_status" db:"subscription_status"` // none, active, past_due, canceled
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

// User represents a user linked to a Kratos identity
type User struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	KratosID  uuid.UUID  `json:"kratos_id" db:"kratos_id"`
	CompanyID *uuid.UUID `json:"company_id,omitempty" db:"company_id"`
	Role      string     `json:"role" db:"role"` // owner, admin, member
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
}

// Team represents a team within a company
type Team struct {
	ID          uuid.UUID `json:"id" db:"id"`
	CompanyID   uuid.UUID `json:"company_id" db:"company_id"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// TeamMember represents a user's membership in a team
type TeamMember struct {
	ID        uuid.UUID `json:"id" db:"id"`
	TeamID    uuid.UUID `json:"team_id" db:"team_id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Role      string    `json:"role" db:"role"` // lead, member
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// UserWithCompany combines User and Company data
type UserWithCompany struct {
	User    User     `json:"user"`
	Company *Company `json:"company,omitempty"`
}

// OnboardRequest represents the onboarding payload
type OnboardRequest struct {
	CompanyName string `json:"company_name" binding:"required,min=1,max=200"`
	Plan        string `json:"plan" binding:"required,oneof=starter pro enterprise"`
}

// CreateTeamRequest represents the team creation payload
type CreateTeamRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100"`
	Description string `json:"description,omitempty"`
}

// UpdateTeamRequest represents the team update payload
type UpdateTeamRequest struct {
	Name        string `json:"name,omitempty" binding:"omitempty,min=1,max=100"`
	Description string `json:"description,omitempty"`
}

// AddTeamMemberRequest represents adding a member to a team
type AddTeamMemberRequest struct {
	UserID uuid.UUID `json:"user_id" binding:"required"`
	Role   string    `json:"role" binding:"required,oneof=lead member"`
}

// Billing-related types

// CheckoutResponse contains the Stripe Checkout session URL
type CheckoutResponse struct {
	URL string `json:"url"`
}

// PortalResponse contains the Stripe Customer Portal URL
type PortalResponse struct {
	URL string `json:"url"`
}

// BillingInfo contains the current billing status for a company
type BillingInfo struct {
	Plan              string `json:"plan"`
	Status            string `json:"status"`
	SeatCount         int    `json:"seat_count"`
	PricePerSeat      int    `json:"price_per_seat"`       // cents ($12 = 1200)
	CurrentPeriodEnd  *int64 `json:"current_period_end"`   // unix timestamp
	CancelAtPeriodEnd bool   `json:"cancel_at_period_end"`
}
