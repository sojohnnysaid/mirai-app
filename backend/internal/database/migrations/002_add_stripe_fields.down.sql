-- Remove Stripe billing fields from companies table
DROP INDEX IF EXISTS idx_companies_stripe_customer_id;

ALTER TABLE companies
    DROP COLUMN IF EXISTS subscription_status,
    DROP COLUMN IF EXISTS stripe_subscription_id,
    DROP COLUMN IF EXISTS stripe_customer_id;
