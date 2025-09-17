-- Add Stripe customer ID to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;