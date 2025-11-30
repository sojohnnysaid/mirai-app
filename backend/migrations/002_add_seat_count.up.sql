-- Add seat_count column to companies table
-- Purchased seats from Stripe subscription (0 = use plan default)
ALTER TABLE companies ADD COLUMN seat_count INTEGER NOT NULL DEFAULT 0;
