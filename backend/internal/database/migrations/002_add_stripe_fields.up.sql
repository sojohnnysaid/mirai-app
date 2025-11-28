-- Add Stripe billing fields to companies table
ALTER TABLE companies
    ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE,
    ADD COLUMN stripe_subscription_id VARCHAR(255),
    ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'none';

-- Index for quick lookup by Stripe customer ID (used in webhooks)
CREATE INDEX idx_companies_stripe_customer_id ON companies(stripe_customer_id);
