-- Pending registrations table for deferred account creation
-- Stores registration data until payment is confirmed via Stripe webhook

CREATE TABLE pending_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkout_session_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    industry VARCHAR(100),
    team_size VARCHAR(50),
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('starter', 'pro', 'enterprise')),
    seat_count INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'provisioning', 'failed')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for webhook lookup by checkout session ID
CREATE INDEX idx_pending_registrations_checkout_session ON pending_registrations(checkout_session_id);

-- Index for cleanup job to find expired registrations
CREATE INDEX idx_pending_registrations_expires_at ON pending_registrations(expires_at);

-- Index for provisioning job to find paid registrations
CREATE INDEX idx_pending_registrations_status ON pending_registrations(status) WHERE status = 'paid';

-- Index to check if email already has pending registration
CREATE INDEX idx_pending_registrations_email ON pending_registrations(email);
