-- Simplified Offering-Based Product Model
-- Replaces complex template system with clean offering → session → product flow

-- Create offering types enum
CREATE TYPE offering_type AS ENUM ('tasting', 'wset_course', 'standalone_exam', 'product');
CREATE TYPE delivery_method AS ENUM ('in_person', 'online', 'hybrid');
CREATE TYPE component_type AS ENUM ('addon', 'upgrade', 'required');

-- Core offerings table (what Phillip manages)
CREATE TABLE offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type offering_type NOT NULL,

  -- WSET specific fields
  wset_level INTEGER CHECK (wset_level >= 1 AND wset_level <= 4),
  exam_type TEXT, -- 'theory', 'tasting', 'both'

  -- Pricing and logistics
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  default_duration_hours INTEGER DEFAULT 8,
  default_capacity INTEGER DEFAULT 20,

  -- Business settings
  active BOOLEAN DEFAULT true,
  auto_create_products BOOLEAN DEFAULT true,
  stripe_sync_enabled BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Scheduled sessions (instances of offerings)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,

  -- Session details
  name TEXT, -- Override name if needed
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE, -- For multi-day courses
  location TEXT,
  instructor TEXT,
  delivery_method delivery_method DEFAULT 'in_person',

  -- Capacity management
  max_capacity INTEGER NOT NULL,
  current_enrollment INTEGER DEFAULT 0,
  available_spots INTEGER GENERATED ALWAYS AS (max_capacity - current_enrollment) STORED,

  -- Booking settings
  booking_enabled BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  early_bird_deadline TIMESTAMP WITH TIME ZONE,
  early_bird_discount_percent INTEGER DEFAULT 15 CHECK (early_bird_discount_percent >= 0 AND early_bird_discount_percent <= 100),

  -- Generated product relationship
  product_id UUID REFERENCES products(id),

  -- Status
  status session_status DEFAULT 'scheduled',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  CONSTRAINT valid_session_dates CHECK (end_date IS NULL OR end_date >= session_date)
);

-- Optional components (add-ons, upgrades)
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type component_type NOT NULL,

  -- Pricing
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),

  -- Applicability rules
  applicable_offering_types offering_type[],
  applicable_wset_levels INTEGER[],
  applicable_delivery_methods delivery_method[],

  -- Inventory (for physical items)
  is_physical BOOLEAN DEFAULT false,
  inventory_tracked BOOLEAN DEFAULT false,
  inventory_quantity INTEGER DEFAULT 0,

  -- Settings
  active BOOLEAN DEFAULT true,
  auto_include BOOLEAN DEFAULT false, -- Automatically include in certain offerings

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Link components to specific sessions (overrides)
CREATE TABLE session_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,

  -- Override pricing for this session
  override_price DECIMAL(10,2),
  is_included BOOLEAN DEFAULT false, -- Included in base price vs. add-on
  is_required BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  UNIQUE(session_id, component_id)
);

-- Insert default WSET offerings
INSERT INTO offerings (name, description, type, wset_level, base_price, default_duration_hours, default_capacity, metadata) VALUES
-- WSET Courses
('WSET Level 1 Award in Wines',
 'An introductory course for wine novices, covering the basic principles of wine and wine tasting.',
 'wset_course', 1, 325.00, 8, 16,
 '{"includes_exam": true, "includes_materials": true, "single_day": true}'),

('WSET Level 2 Award in Wines',
 'For those with some knowledge who want to understand wine in greater depth.',
 'wset_course', 2, 599.00, 24, 20,
 '{"includes_exam": true, "includes_study_pack": true, "multi_day": true}'),

('WSET Level 3 Award in Wines',
 'A comprehensive study of wines suitable for wine professionals and serious enthusiasts.',
 'wset_course', 3, 1400.00, 40, 18,
 '{"includes_exam": true, "includes_study_pack": true, "multi_day": true, "includes_tasting_tutorial": true}'),

-- Standalone Exams
('WSET Level 1 Theory Exam',
 'Theory examination for WSET Level 1 qualification',
 'standalone_exam', 1, 75.00, 1, 30,
 '{"exam_type": "theory", "duration_minutes": 45}'),

('WSET Level 1 Tasting Exam',
 'Tasting examination for WSET Level 1 qualification',
 'standalone_exam', 1, 50.00, 1, 20,
 '{"exam_type": "tasting", "duration_minutes": 30, "wines_provided": 2}'),

('WSET Level 2 Theory Exam',
 'Theory examination for WSET Level 2 qualification',
 'standalone_exam', 2, 100.00, 1, 30,
 '{"exam_type": "theory", "duration_minutes": 60}'),

('WSET Level 2 Tasting Exam',
 'Tasting examination for WSET Level 2 qualification',
 'standalone_exam', 2, 85.00, 1, 20,
 '{"exam_type": "tasting", "duration_minutes": 60, "wines_provided": 6}'),

('WSET Level 3 Theory Exam',
 'Theory examination for WSET Level 3 qualification',
 'standalone_exam', 3, 150.00, 2, 25,
 '{"exam_type": "theory", "duration_minutes": 120}'),

('WSET Level 3 Tasting Exam',
 'Tasting examination for WSET Level 3 qualification',
 'standalone_exam', 3, 125.00, 2, 15,
 '{"exam_type": "tasting", "duration_minutes": 90, "wines_provided": 12}');

-- Insert default components
INSERT INTO components (name, description, type, price, applicable_offering_types, applicable_wset_levels, applicable_delivery_methods, metadata) VALUES
-- Remote exam upgrades
('Remote Exam - Level 1',
 'Take your Level 1 exam remotely instead of in-person',
 'upgrade', 45.00,
 ARRAY['wset_course'::offering_type], ARRAY[1], ARRAY['online'::delivery_method],
 '{"replaces_in_person_exam": true}'),

('Remote Exam - Level 2',
 'Take your Level 2 exam remotely instead of in-person',
 'upgrade', 85.00,
 ARRAY['wset_course'::offering_type], ARRAY[2], ARRAY['online'::delivery_method],
 '{"replaces_in_person_exam": true}'),

-- Tasting kits
('Master the World Wine Samples Kit - Level 1',
 'Complete tasting kit for WSET Level 1 self-study',
 'addon', 100.00,
 ARRAY['wset_course'::offering_type, 'product'::offering_type], ARRAY[1], ARRAY['online'::delivery_method, 'in_person'::delivery_method],
 '{"wine_count": 6, "includes_tasting_notes": true, "shipping_required": true, "can_buy_standalone": true}'),

('Wine Samples Kit - Level 2',
 'Complete tasting kit for WSET Level 2',
 'addon', 149.00,
 ARRAY['wset_course'::offering_type], ARRAY[2], ARRAY['online'::delivery_method, 'in_person'::delivery_method],
 '{"wine_count": 12, "includes_tasting_notes": true, "shipping_required": true}'),

('Wine Samples Kit - Level 3',
 'Complete tasting kit for WSET Level 3',
 'addon', 299.00,
 ARRAY['wset_course'::offering_type], ARRAY[3], ARRAY['online'::delivery_method, 'in_person'::delivery_method],
 '{"wine_count": 24, "includes_tasting_notes": true, "shipping_required": true}'),

-- Study materials
('Digital Classroom Access',
 'Access to WSET Digital Classroom platform',
 'required', 0.00,
 ARRAY['wset_course'::offering_type], ARRAY[1,2,3], ARRAY['online'::delivery_method],
 '{"duration_days": 90, "auto_include": true}'),

('Study Pack - Level 2',
 'Complete study materials for WSET Level 2',
 'required', 0.00,
 ARRAY['wset_course'::offering_type], ARRAY[2], ARRAY['online'::delivery_method, 'in_person'::delivery_method],
 '{"includes_workbook": true, "includes_maps": true, "auto_include": true}'),

('Study Pack - Level 3',
 'Complete study materials for WSET Level 3',
 'required', 0.00,
 ARRAY['wset_course'::offering_type], ARRAY[3], ARRAY['online'::delivery_method, 'in_person'::delivery_method],
 '{"includes_workbook": true, "includes_maps": true, "includes_systematic_tasting": true, "auto_include": true}');

-- Function to auto-generate products from sessions
CREATE OR REPLACE FUNCTION auto_create_product_for_session()
RETURNS TRIGGER AS $$
DECLARE
  offering_record RECORD;
  product_name TEXT;
  product_description TEXT;
  early_bird_price DECIMAL(10,2);
  product_metadata JSONB;
  new_product_id UUID;
BEGIN
  -- Get the offering details
  SELECT * INTO offering_record
  FROM offerings
  WHERE id = NEW.offering_id
  AND auto_create_products = true;

  IF offering_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Generate intelligent product name
  IF NEW.name IS NOT NULL THEN
    product_name := NEW.name;
  ELSE
    product_name := offering_record.name || ' - ' || TO_CHAR(NEW.session_date, 'Mon DD, YYYY');

    IF NEW.location IS NOT NULL THEN
      product_name := product_name || ' (' || NEW.location || ')';
    END IF;
  END IF;

  -- Generate product description
  product_description := offering_record.description;

  IF offering_record.description IS NOT NULL THEN
    product_description := product_description || E'\n\nSession Details:';
  ELSE
    product_description := 'Session Details:';
  END IF;

  product_description := product_description || E'\n• Date: ' || TO_CHAR(NEW.session_date, 'Day, Mon DD, YYYY at HH12:MI AM');

  IF NEW.end_date IS NOT NULL AND NEW.end_date::DATE != NEW.session_date::DATE THEN
    product_description := product_description || E'\n• End Date: ' || TO_CHAR(NEW.end_date, 'Day, Mon DD, YYYY at HH12:MI AM');
  END IF;

  IF NEW.location IS NOT NULL THEN
    product_description := product_description || E'\n• Location: ' || NEW.location;
  END IF;

  IF NEW.instructor IS NOT NULL THEN
    product_description := product_description || E'\n• Instructor: ' || NEW.instructor;
  END IF;

  product_description := product_description || E'\n• Capacity: ' || NEW.max_capacity || ' spots';
  product_description := product_description || E'\n• Delivery: ' || REPLACE(NEW.delivery_method::TEXT, '_', ' ');

  -- Calculate early bird price
  early_bird_price := ROUND(offering_record.base_price * (100 - COALESCE(NEW.early_bird_discount_percent, 0)) / 100.0, 2);

  -- Build comprehensive metadata
  product_metadata := offering_record.metadata || jsonb_build_object(
    'offering_type', offering_record.type,
    'wset_level', offering_record.wset_level,
    'session_id', NEW.id,
    'offering_id', offering_record.id,
    'session_date', NEW.session_date,
    'end_date', NEW.end_date,
    'location', NEW.location,
    'instructor', NEW.instructor,
    'delivery_method', NEW.delivery_method,
    'max_capacity', NEW.max_capacity,
    'base_price', offering_record.base_price,
    'early_bird_price', early_bird_price,
    'early_bird_deadline', NEW.early_bird_deadline,
    'registration_deadline', NEW.registration_deadline,
    'auto_generated', true
  );

  -- Create the product
  INSERT INTO products (
    name,
    description,
    type,
    active,
    metadata
  ) VALUES (
    product_name,
    product_description,
    CASE
      WHEN offering_record.type = 'wset_course' THEN 'course_session'
      WHEN offering_record.type = 'standalone_exam' THEN 'spot_exam'
      WHEN offering_record.type = 'tasting' THEN 'digital_product'
      ELSE 'digital_product'
    END,
    offering_record.active,
    product_metadata
  ) RETURNING id INTO new_product_id;

  -- Link the session to the product
  NEW.product_id := new_product_id;

  -- Set default early bird deadline if not specified (30 days before)
  IF NEW.early_bird_deadline IS NULL THEN
    NEW.early_bird_deadline := NEW.session_date - INTERVAL '30 days';
  END IF;

  -- Set default registration deadline if not specified (7 days before)
  IF NEW.registration_deadline IS NULL THEN
    NEW.registration_deadline := NEW.session_date - INTERVAL '7 days';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto product generation
CREATE TRIGGER trigger_auto_create_product_for_session
  BEFORE INSERT ON sessions
  FOR EACH ROW
  WHEN (NEW.product_id IS NULL)
  EXECUTE FUNCTION auto_create_product_for_session();

-- Function to update enrollment counts
CREATE OR REPLACE FUNCTION update_session_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session enrollment when orders are paid
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    UPDATE sessions
    SET current_enrollment = current_enrollment + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    AND sessions.product_id = oi.product_id;
  END IF;

  -- Decrease enrollment if order is cancelled or refunded
  IF NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded') THEN
    UPDATE sessions
    SET current_enrollment = GREATEST(0, current_enrollment - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    AND sessions.product_id = oi.product_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for enrollment updates
CREATE TRIGGER trigger_update_session_enrollment
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_session_enrollment();

-- Create indexes for performance
CREATE INDEX idx_offerings_type ON offerings(type);
CREATE INDEX idx_offerings_wset_level ON offerings(wset_level) WHERE wset_level IS NOT NULL;
CREATE INDEX idx_offerings_active ON offerings(active) WHERE active = true;

CREATE INDEX idx_sessions_offering_id ON sessions(offering_id);
CREATE INDEX idx_sessions_session_date ON sessions(session_date);
CREATE INDEX idx_sessions_product_id ON sessions(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_sessions_booking_enabled ON sessions(booking_enabled) WHERE booking_enabled = true;
CREATE INDEX idx_sessions_available_spots ON sessions(available_spots) WHERE available_spots > 0;

CREATE INDEX idx_components_type ON components(type);
CREATE INDEX idx_components_active ON components(active) WHERE active = true;
CREATE INDEX idx_components_applicable_offering_types ON components USING GIN (applicable_offering_types);

CREATE INDEX idx_session_components_session_id ON session_components(session_id);
CREATE INDEX idx_session_components_component_id ON session_components(component_id);

-- Enable Row Level Security
ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_components ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offerings (public read active, admin manage)
CREATE POLICY "Active offerings are viewable by everyone" ON offerings
  FOR SELECT USING (active = true);

CREATE POLICY "Offerings are manageable by authenticated users" ON offerings
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for sessions (public read bookable, admin manage)
CREATE POLICY "Bookable sessions are viewable by everyone" ON sessions
  FOR SELECT USING (booking_enabled = true AND available_spots > 0);

CREATE POLICY "Sessions are manageable by authenticated users" ON sessions
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for components (public read active, admin manage)
CREATE POLICY "Active components are viewable by everyone" ON components
  FOR SELECT USING (active = true);

CREATE POLICY "Components are manageable by authenticated users" ON components
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for session components (inherit from sessions)
CREATE POLICY "Session components are viewable through sessions" ON session_components
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_components.session_id
      AND sessions.booking_enabled = true
    )
  );

CREATE POLICY "Session components are manageable by authenticated users" ON session_components
  FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at triggers
CREATE TRIGGER update_offerings_updated_at BEFORE UPDATE ON offerings
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Add comments for documentation
COMMENT ON TABLE offerings IS 'Core business offerings that Phillip manages (tastings, courses, exams, products)';
COMMENT ON TABLE sessions IS 'Scheduled instances of offerings with specific dates, locations, and capacity';
COMMENT ON TABLE components IS 'Optional add-ons, upgrades, and required components for offerings';
COMMENT ON TABLE session_components IS 'Links components to specific sessions with pricing overrides';
COMMENT ON FUNCTION auto_create_product_for_session() IS 'Automatically creates Stripe-ready products when sessions are scheduled';
COMMENT ON FUNCTION update_session_enrollment() IS 'Updates session enrollment counts when orders are paid or cancelled';