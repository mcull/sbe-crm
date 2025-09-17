-- E-commerce Schema Migration
-- This migration adds all necessary tables and relationships for e-commerce functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- Products table for managing products/services
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'course_session', -- 'course_session', 'digital_product', 'physical_product'
  stripe_product_id TEXT UNIQUE,
  stripe_price_id TEXT, -- Default price ID for simple products
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Extend course_sessions table for e-commerce
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2);
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS early_bird_price DECIMAL(10,2);
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS early_bird_deadline DATE;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS available_spots INTEGER;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS registration_deadline DATE;
ALTER TABLE course_sessions ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT true;

-- Orders table for managing customer orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- Human-readable order number (e.g., SBE-2024-001)
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  billing_address JSONB DEFAULT '{}', -- Store full billing address
  subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',

  -- Stripe integration fields
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Order status and metadata
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'canceled'
  fulfillment_status TEXT DEFAULT 'unfulfilled', -- 'unfulfilled', 'partial', 'fulfilled'

  -- Additional fields
  notes TEXT,
  admin_notes TEXT, -- Internal notes not visible to customer
  discount_code TEXT,
  referral_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Order items table for individual line items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  course_session_id UUID REFERENCES course_sessions(id),

  -- Item details at time of purchase (for historical accuracy)
  name TEXT NOT NULL, -- Product name snapshot
  description TEXT,
  sku TEXT,

  -- Pricing
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  -- Product snapshot for historical reference
  product_snapshot JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Shopping carts for session persistence
CREATE TABLE shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL, -- Browser session ID
  customer_email TEXT, -- Optional: for logged-in users or email capture

  -- Cart contents stored as JSON
  items JSONB NOT NULL DEFAULT '[]', -- Array of cart items

  -- Metadata
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  discount_code TEXT,

  -- Expiration and cleanup
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Discount codes table for promotional campaigns
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT, -- Display name for admin
  description TEXT,

  -- Discount configuration
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
  value DECIMAL(10,2) NOT NULL, -- Percentage (0-100) or fixed amount

  -- Usage restrictions
  minimum_order_amount DECIMAL(10,2), -- Minimum order total required
  maximum_discount_amount DECIMAL(10,2), -- Cap for percentage discounts
  usage_limit INTEGER, -- Total usage limit (NULL = unlimited)
  usage_limit_per_customer INTEGER, -- Per-customer usage limit
  usage_count INTEGER NOT NULL DEFAULT 0,

  -- Applicable products/categories
  applicable_product_ids UUID[], -- Specific products (NULL = all products)
  applicable_course_levels INTEGER[], -- WSET levels [1,2,3,4]

  -- Time restrictions
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Status
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Discount usage tracking
CREATE TABLE discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Ensure one usage per order
  UNIQUE(discount_code_id, order_id)
);

-- Media assets table for product images and content
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  url TEXT NOT NULL,

  -- Organization
  folder TEXT DEFAULT 'uploads',
  tags TEXT[] DEFAULT '{}',

  -- Usage tracking
  product_id UUID REFERENCES products(id), -- If associated with a product

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Analytics tables for tracking business metrics
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  page_title TEXT,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  session_id TEXT,
  user_id UUID, -- If authenticated
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'course_view', 'add_to_cart', 'checkout_started', 'purchase', 'registration'
  session_id TEXT,
  user_id UUID,
  course_session_id UUID REFERENCES course_sessions(id),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),

  -- Event metadata
  event_value DECIMAL(10,2), -- Revenue value for this event
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Customer lifecycle and segmentation
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS customer_since DATE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS communication_preferences JSONB DEFAULT '{"email": true, "sms": false, "marketing": false}';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS customer_segment TEXT; -- 'new', 'returning', 'vip', 'at_risk'
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS last_order_date DATE;

-- Link orders to candidates (customers)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES candidates(id);

-- Create indexes for performance
CREATE INDEX idx_products_active ON products(active) WHERE active = true;
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_stripe_product_id ON products(stripe_product_id) WHERE stripe_product_id IS NOT NULL;

CREATE INDEX idx_course_sessions_product_id ON course_sessions(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_course_sessions_available_spots ON course_sessions(available_spots) WHERE available_spots > 0;
CREATE INDEX idx_course_sessions_booking_enabled ON course_sessions(booking_enabled) WHERE booking_enabled = true;
CREATE INDEX idx_course_sessions_registration_deadline ON course_sessions(registration_deadline) WHERE registration_deadline IS NOT NULL;

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_candidate_id ON orders(candidate_id) WHERE candidate_id IS NOT NULL;
CREATE INDEX idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_order_items_course_session_id ON order_items(course_session_id) WHERE course_session_id IS NOT NULL;

CREATE INDEX idx_shopping_carts_session_id ON shopping_carts(session_id);
CREATE INDEX idx_shopping_carts_expires_at ON shopping_carts(expires_at);
CREATE INDEX idx_shopping_carts_customer_email ON shopping_carts(customer_email) WHERE customer_email IS NOT NULL;

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(active) WHERE active = true;
CREATE INDEX idx_discount_codes_expires_at ON discount_codes(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_discount_usage_discount_code_id ON discount_usage(discount_code_id);
CREATE INDEX idx_discount_usage_customer_email ON discount_usage(customer_email);

CREATE INDEX idx_media_assets_product_id ON media_assets(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_media_assets_folder ON media_assets(folder);

CREATE INDEX idx_page_views_page_path ON page_views(page_path);
CREATE INDEX idx_page_views_viewed_at ON page_views(viewed_at DESC);
CREATE INDEX idx_page_views_session_id ON page_views(session_id) WHERE session_id IS NOT NULL;

CREATE INDEX idx_conversion_events_event_type ON conversion_events(event_type);
CREATE INDEX idx_conversion_events_created_at ON conversion_events(created_at DESC);
CREATE INDEX idx_conversion_events_order_id ON conversion_events(order_id) WHERE order_id IS NOT NULL;

CREATE INDEX idx_candidates_customer_since ON candidates(customer_since) WHERE customer_since IS NOT NULL;
CREATE INDEX idx_candidates_customer_segment ON candidates(customer_segment) WHERE customer_segment IS NOT NULL;
CREATE INDEX idx_candidates_last_order_date ON candidates(last_order_date) WHERE last_order_date IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (active = true);

CREATE POLICY "Products are manageable by authenticated users" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for orders (customers can view own orders, admins can view all)
CREATE POLICY "Orders are viewable by order owner or admin" ON orders
  FOR SELECT USING (
    auth.role() = 'authenticated' OR
    (auth.jwt() ->> 'email') = customer_email
  );

CREATE POLICY "Orders are manageable by authenticated users" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for order_items (inherit from orders)
CREATE POLICY "Order items are viewable through orders" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        auth.role() = 'authenticated' OR
        (auth.jwt() ->> 'email') = orders.customer_email
      )
    )
  );

CREATE POLICY "Order items are manageable by authenticated users" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for shopping carts (users can manage their own carts)
CREATE POLICY "Shopping carts are viewable by cart owner" ON shopping_carts
  FOR SELECT USING (
    auth.role() = 'authenticated' OR
    (auth.jwt() ->> 'email') = customer_email OR
    session_id = (current_setting('app.session_id', true))
  );

CREATE POLICY "Shopping carts are manageable by cart owner" ON shopping_carts
  FOR ALL USING (
    auth.role() = 'authenticated' OR
    (auth.jwt() ->> 'email') = customer_email OR
    session_id = (current_setting('app.session_id', true))
  );

-- RLS Policies for discount codes (public read active codes, admin manage)
CREATE POLICY "Active discount codes are viewable by everyone" ON discount_codes
  FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Discount codes are manageable by authenticated users" ON discount_codes
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for discount usage (users can view own usage, admins can view all)
CREATE POLICY "Discount usage is viewable by user or admin" ON discount_usage
  FOR SELECT USING (
    auth.role() = 'authenticated' OR
    (auth.jwt() ->> 'email') = customer_email
  );

CREATE POLICY "Discount usage is manageable by authenticated users" ON discount_usage
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for media assets (public read, admin write)
CREATE POLICY "Media assets are viewable by everyone" ON media_assets
  FOR SELECT USING (true);

CREATE POLICY "Media assets are manageable by authenticated users" ON media_assets
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for analytics (admin only)
CREATE POLICY "Page views are manageable by authenticated users" ON page_views
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Conversion events are manageable by authenticated users" ON conversion_events
  FOR ALL USING (auth.role() = 'authenticated');

-- Create functions for automated order processing
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  order_num TEXT;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(order_number, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM orders
  WHERE order_number LIKE 'SBE-' || year_part || '-%';

  -- Format: SBE-2024-001
  order_num := 'SBE-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');

  -- Set the order number on the NEW record
  NEW.order_number := order_num;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer statistics
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update candidate/customer statistics when order status changes to paid
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.candidate_id IS NOT NULL THEN
    UPDATE candidates
    SET
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total_amount,
      lifetime_value = total_spent + NEW.total_amount,
      last_order_date = CURRENT_DATE,
      customer_since = COALESCE(customer_since, CURRENT_DATE)
    WHERE id = NEW.candidate_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update inventory when orders are placed
CREATE OR REPLACE FUNCTION update_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease available spots when order is paid
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE course_sessions
    SET available_spots = GREATEST(0, available_spots - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    AND oi.course_session_id = course_sessions.id;
  END IF;

  -- Increase available spots if order is cancelled or refunded
  IF NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded') THEN
    UPDATE course_sessions
    SET available_spots = available_spots + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    AND oi.course_session_id = course_sessions.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

CREATE TRIGGER trigger_update_customer_stats
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

CREATE TRIGGER trigger_update_inventory
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory();

-- Create updated_at triggers for timestamp management
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE TRIGGER update_shopping_carts_updated_at BEFORE UPDATE ON shopping_carts
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE TRIGGER update_media_assets_updated_at BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Insert sample data for testing
DO $$
BEGIN
  -- Insert sample products for existing courses
  INSERT INTO products (name, description, type, active)
  SELECT
    name || ' - Product',
    description,
    'course_session',
    true
  FROM courses
  ON CONFLICT DO NOTHING;

  -- Link course sessions to products
  UPDATE course_sessions
  SET
    product_id = p.id,
    base_price =
      CASE
        WHEN c.wset_level = 1 THEN 299.00
        WHEN c.wset_level = 2 THEN 599.00
        WHEN c.wset_level = 3 THEN 899.00
        WHEN c.wset_level = 4 THEN 1599.00
        ELSE 599.00
      END,
    early_bird_price =
      CASE
        WHEN c.wset_level = 1 THEN 249.00
        WHEN c.wset_level = 2 THEN 499.00
        WHEN c.wset_level = 3 THEN 749.00
        WHEN c.wset_level = 4 THEN 1299.00
        ELSE 499.00
      END,
    early_bird_deadline = start_date - INTERVAL '30 days',
    available_spots = COALESCE(c.max_capacity, 20),
    registration_deadline = start_date - INTERVAL '7 days',
    booking_enabled = true
  FROM courses c, products p
  WHERE course_sessions.course_id = c.id
  AND p.name = c.name || ' - Product'
  AND course_sessions.product_id IS NULL;

  -- Insert sample discount codes
  INSERT INTO discount_codes (code, name, type, value, active, expires_at) VALUES
  ('EARLYBIRD10', 'Early Bird 10%', 'percentage', 10.00, true, NOW() + INTERVAL '6 months'),
  ('NEWSTUDENT20', 'New Student 20%', 'percentage', 20.00, true, NOW() + INTERVAL '1 year'),
  ('SAVE50', '$50 Off', 'fixed_amount', 50.00, true, NOW() + INTERVAL '3 months')
  ON CONFLICT (code) DO NOTHING;

END $$;

-- Add comments for documentation
COMMENT ON TABLE products IS 'Products/services available for purchase';
COMMENT ON TABLE orders IS 'Customer orders with payment and fulfillment tracking';
COMMENT ON TABLE order_items IS 'Individual line items within orders';
COMMENT ON TABLE shopping_carts IS 'Session-based shopping carts for customers';
COMMENT ON TABLE discount_codes IS 'Promotional discount codes and campaigns';
COMMENT ON TABLE discount_usage IS 'Tracking of discount code usage';
COMMENT ON TABLE media_assets IS 'File storage for product images and content';
COMMENT ON TABLE page_views IS 'Website analytics and page view tracking';
COMMENT ON TABLE conversion_events IS 'E-commerce conversion and funnel tracking';