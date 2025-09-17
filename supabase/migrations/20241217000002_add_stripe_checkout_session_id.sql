-- Add Stripe checkout session ID to orders table for better webhook handling
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT UNIQUE;