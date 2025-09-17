-- Enhanced Product Model Migration
-- Creates a more opinionated system where products are auto-generated from course templates

-- Create product_types enum for better type safety
CREATE TYPE product_type AS ENUM (
  'course_session',    -- WSET courses with sessions
  'spot_exam',         -- Individual exams without courses
  'digital_product',   -- Tasting kits, study materials, etc.
  'physical_product'   -- Books, equipment, etc.
);

-- Enhance course_templates to be the single source of truth
ALTER TABLE course_templates ADD COLUMN IF NOT EXISTS product_type product_type DEFAULT 'course_session';
ALTER TABLE course_templates ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2);
ALTER TABLE course_templates ADD COLUMN IF NOT EXISTS early_bird_discount_percent INTEGER DEFAULT 15 CHECK (early_bird_discount_percent >= 0 AND early_bird_discount_percent <= 100);
ALTER TABLE course_templates ADD COLUMN IF NOT EXISTS early_bird_deadline_days INTEGER DEFAULT 30 CHECK (early_bird_deadline_days >= 0);
ALTER TABLE course_templates ADD COLUMN IF NOT EXISTS registration_deadline_days INTEGER DEFAULT 7 CHECK (registration_deadline_days >= 0);
ALTER TABLE course_templates ADD COLUMN IF NOT EXISTS auto_create_products BOOLEAN DEFAULT true;
ALTER TABLE course_templates ADD COLUMN IF NOT EXISTS stripe_sync_enabled BOOLEAN DEFAULT true;
ALTER TABLE course_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add metadata for different product types
ALTER TABLE course_templates ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update existing course templates with enhanced data
UPDATE course_templates SET
  base_price = CASE
    WHEN wset_level = 1 THEN 299.00
    WHEN wset_level = 2 THEN 599.00
    WHEN wset_level = 3 THEN 899.00
    WHEN wset_level = 4 THEN 1599.00
  END,
  product_type = 'course_session',
  auto_create_products = true,
  stripe_sync_enabled = true,
  is_active = true,
  metadata = jsonb_build_object(
    'includes_tasting_kit', CASE WHEN wset_level >= 2 THEN true ELSE false END,
    'includes_materials', true,
    'certificate_type', 'wset_level_' || wset_level,
    'course_format', 'hybrid'
  )
WHERE product_type IS NULL;

-- Create exam_templates table for spot exams
CREATE TABLE exam_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  wset_level INTEGER CHECK (wset_level >= 1 AND wset_level <= 4),
  exam_type exam_type NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_capacity INTEGER NOT NULL DEFAULT 20,
  base_price DECIMAL(10,2) NOT NULL,
  location_type TEXT DEFAULT 'in_person', -- 'in_person', 'online', 'hybrid'
  auto_create_products BOOLEAN DEFAULT true,
  stripe_sync_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default exam templates
INSERT INTO exam_templates (name, description, wset_level, exam_type, duration_minutes, max_capacity, base_price, metadata) VALUES
('WSET Level 1 Theory Exam', 'Theory examination for WSET Level 1 qualification', 1, 'theory', 45, 30, 75.00, '{"retake": false, "materials_required": ["pencil", "answer_sheet"]}'),
('WSET Level 1 Tasting Exam', 'Tasting examination for WSET Level 1 qualification', 1, 'tasting', 30, 20, 50.00, '{"retake": false, "wines_provided": 2}'),
('WSET Level 2 Theory Exam', 'Theory examination for WSET Level 2 qualification', 2, 'theory', 60, 30, 100.00, '{"retake": false, "materials_required": ["pencil", "answer_sheet"]}'),
('WSET Level 2 Tasting Exam', 'Tasting examination for WSET Level 2 qualification', 2, 'tasting', 60, 20, 75.00, '{"retake": false, "wines_provided": 6}'),
('WSET Level 3 Theory Exam', 'Theory examination for WSET Level 3 qualification', 3, 'theory', 120, 25, 150.00, '{"retake": false, "materials_required": ["pencil", "answer_sheet", "maps"]}'),
('WSET Level 3 Tasting Exam', 'Tasting examination for WSET Level 3 qualification', 3, 'tasting', 90, 15, 125.00, '{"retake": false, "wines_provided": 12}'),
('WSET Level 4 Unit 1 Exam', 'Unit 1 examination for WSET Level 4 Diploma', 4, 'theory', 180, 20, 200.00, '{"unit": 1, "retake": false}'),
('WSET Level 4 Unit 2 Exam', 'Unit 2 examination for WSET Level 4 Diploma', 4, 'theory', 180, 20, 200.00, '{"unit": 2, "retake": false}'),
('WSET Level 4 Unit 3 Exam', 'Unit 3 examination for WSET Level 4 Diploma', 4, 'theory', 180, 20, 200.00, '{"unit": 3, "retake": false}'),
('WSET Level 4 Tasting Exam', 'Tasting examination for WSET Level 4 Diploma', 4, 'tasting', 120, 12, 250.00, '{"retake": false, "wines_provided": 12, "blind_tasting": true}');

-- Create digital_product_templates for tasting kits, materials, etc.
CREATE TABLE digital_product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'tasting_kit', 'study_materials', 'merchandise', 'gift_voucher'
  base_price DECIMAL(10,2) NOT NULL,
  is_physical BOOLEAN DEFAULT false, -- true for items that need shipping
  wset_level INTEGER CHECK (wset_level >= 1 AND wset_level <= 4), -- NULL for non-course specific
  auto_create_products BOOLEAN DEFAULT true,
  stripe_sync_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  inventory_tracked BOOLEAN DEFAULT false,
  inventory_quantity INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default digital/physical product templates
INSERT INTO digital_product_templates (name, description, category, base_price, is_physical, wset_level, metadata) VALUES
('WSET Level 1 Tasting Kit', 'Complete tasting kit for WSET Level 1 self-study', 'tasting_kit', 89.00, true, 1, '{"wine_count": 6, "includes_tasting_notes": true, "shipping_required": true}'),
('WSET Level 2 Tasting Kit', 'Complete tasting kit for WSET Level 2 self-study', 'tasting_kit', 149.00, true, 2, '{"wine_count": 12, "includes_tasting_notes": true, "includes_maps": true, "shipping_required": true}'),
('WSET Level 3 Tasting Kit', 'Complete tasting kit for WSET Level 3 self-study', 'tasting_kit', 299.00, true, 3, '{"wine_count": 24, "includes_tasting_notes": true, "includes_maps": true, "includes_systematic_tasting": true, "shipping_required": true}'),
('WSET Level 2 Study Guide (Digital)', 'Comprehensive digital study guide for Level 2', 'study_materials', 39.00, false, 2, '{"format": "pdf", "pages": 150, "downloadable": true}'),
('WSET Level 3 Study Guide (Digital)', 'Comprehensive digital study guide for Level 3', 'study_materials', 79.00, false, 3, '{"format": "pdf", "pages": 300, "downloadable": true, "includes_practice_exams": true}'),
('WSET Official Tasting Glass Set', 'Official WSET tasting glasses (set of 6)', 'merchandise', 45.00, true, NULL, '{"quantity": 6, "official_wset": true, "dishwasher_safe": true, "shipping_required": true}'),
('Gift Voucher - $100', 'Gift voucher for any SBE courses or products', 'gift_voucher', 100.00, false, NULL, '{"voucher_value": 100, "expiry_months": 12, "digital_delivery": true}'),
('Gift Voucher - $250', 'Gift voucher for any SBE courses or products', 'gift_voucher', 250.00, false, NULL, '{"voucher_value": 250, "expiry_months": 12, "digital_delivery": true}'),
('Gift Voucher - $500', 'Gift voucher for any SBE courses or products', 'gift_voucher', 500.00, false, NULL, '{"voucher_value": 500, "expiry_months": 12, "digital_delivery": true}');

-- Function to auto-generate products from course sessions
CREATE OR REPLACE FUNCTION auto_create_product_for_session()
RETURNS TRIGGER AS $$
DECLARE
  template_record RECORD;
  product_name TEXT;
  product_description TEXT;
  pricing_info JSONB;
  product_metadata JSONB;
  new_product_id UUID;
BEGIN
  -- Get the course template
  SELECT ct.*, c.name as course_name, c.description as course_description
  INTO template_record
  FROM course_templates ct
  JOIN courses c ON c.wset_level = ct.wset_level
  WHERE ct.wset_level = (
    SELECT wset_level FROM courses WHERE id = NEW.course_id
  )
  AND ct.product_type = 'course_session'
  AND ct.auto_create_products = true
  LIMIT 1;

  IF template_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Generate intelligent product name
  product_name := template_record.course_name || ' - ' ||
    TO_CHAR(NEW.start_date, 'Mon DD, YYYY');

  IF NEW.location IS NOT NULL THEN
    product_name := product_name || ' (' || NEW.location || ')';
  END IF;

  -- Generate product description
  product_description := template_record.course_description || E'\n\n' ||
    'Session Details:' || E'\n' ||
    '• Dates: ' || TO_CHAR(NEW.start_date, 'Mon DD, YYYY') ||
    CASE WHEN NEW.end_date != NEW.start_date
         THEN ' - ' || TO_CHAR(NEW.end_date, 'Mon DD, YYYY')
         ELSE ''
    END || E'\n' ||
    CASE WHEN NEW.location IS NOT NULL
         THEN '• Location: ' || NEW.location || E'\n'
         ELSE ''
    END ||
    '• Instructor: ' || COALESCE(NEW.instructor, 'TBA') || E'\n' ||
    '• Capacity: ' || COALESCE(NEW.available_spots, template_record.max_capacity) || ' spots';

  -- Build pricing information
  pricing_info := jsonb_build_object(
    'base_price', template_record.base_price,
    'early_bird_price', ROUND(template_record.base_price * (100 - template_record.early_bird_discount_percent) / 100.0, 2),
    'early_bird_deadline', NEW.start_date - INTERVAL '1 day' * template_record.early_bird_deadline_days,
    'registration_deadline', NEW.start_date - INTERVAL '1 day' * template_record.registration_deadline_days
  );

  -- Build comprehensive metadata
  product_metadata := template_record.metadata || jsonb_build_object(
    'wset_level', template_record.wset_level,
    'course_type', 'instructor_led',
    'session_id', NEW.id,
    'course_id', NEW.course_id,
    'start_date', NEW.start_date,
    'end_date', NEW.end_date,
    'location', NEW.location,
    'instructor', NEW.instructor,
    'max_capacity', COALESCE(NEW.available_spots, template_record.max_capacity),
    'duration_weeks', template_record.duration_weeks,
    'pricing', pricing_info,
    'auto_generated', true,
    'template_id', template_record.id
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
    template_record.product_type::text,
    template_record.is_active,
    product_metadata
  ) RETURNING id INTO new_product_id;

  -- Link the session to the product
  NEW.product_id := new_product_id;
  NEW.base_price := template_record.base_price;
  NEW.early_bird_price := ROUND(template_record.base_price * (100 - template_record.early_bird_discount_percent) / 100.0, 2);
  NEW.early_bird_deadline := NEW.start_date - INTERVAL '1 day' * template_record.early_bird_deadline_days;
  NEW.registration_deadline := NEW.start_date - INTERVAL '1 day' * template_record.registration_deadline_days;
  NEW.available_spots := COALESCE(NEW.available_spots, template_record.max_capacity);
  NEW.booking_enabled := template_record.is_active;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate products from exam scheduling
CREATE OR REPLACE FUNCTION auto_create_product_for_exam()
RETURNS TRIGGER AS $$
DECLARE
  template_record RECORD;
  product_name TEXT;
  product_description TEXT;
  product_metadata JSONB;
  new_product_id UUID;
BEGIN
  -- Get the exam template (simplified - matches by exam_type and course WSET level)
  SELECT et.*, c.wset_level
  INTO template_record
  FROM exam_templates et, courses c
  WHERE c.id = NEW.course_id
  AND et.wset_level = c.wset_level
  AND et.exam_type = NEW.exam_type
  AND et.auto_create_products = true
  ORDER BY et.created_at DESC
  LIMIT 1;

  IF template_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Generate intelligent product name
  product_name := template_record.name || ' - ' ||
    TO_CHAR(NEW.exam_date, 'Mon DD, YYYY at HH12:MI AM');

  IF NEW.location IS NOT NULL THEN
    product_name := product_name || ' (' || NEW.location || ')';
  END IF;

  -- Generate product description
  product_description := template_record.description || E'\n\n' ||
    'Exam Details:' || E'\n' ||
    '• Date: ' || TO_CHAR(NEW.exam_date, 'Day, Mon DD, YYYY at HH12:MI AM') || E'\n' ||
    '• Location: ' || NEW.location || E'\n' ||
    '• Duration: ' || template_record.duration_minutes || ' minutes' || E'\n' ||
    '• Capacity: ' || NEW.max_candidates || ' candidates' ||
    CASE WHEN NEW.instructions IS NOT NULL
         THEN E'\n• Instructions: ' || NEW.instructions
         ELSE ''
    END;

  -- Build comprehensive metadata
  product_metadata := template_record.metadata || jsonb_build_object(
    'wset_level', template_record.wset_level,
    'exam_type', NEW.exam_type,
    'course_type', 'spot_exam',
    'exam_id', NEW.id,
    'course_id', NEW.course_id,
    'exam_date', NEW.exam_date,
    'location', NEW.location,
    'duration_minutes', template_record.duration_minutes,
    'max_capacity', NEW.max_candidates,
    'auto_generated', true,
    'template_id', template_record.id
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
    'spot_exam',
    template_record.is_active,
    product_metadata
  ) RETURNING id INTO new_product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto product generation
CREATE TRIGGER trigger_auto_create_product_for_session
  BEFORE INSERT ON course_sessions
  FOR EACH ROW
  WHEN (NEW.product_id IS NULL)
  EXECUTE FUNCTION auto_create_product_for_session();

CREATE TRIGGER trigger_auto_create_product_for_exam
  AFTER INSERT ON exams
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_product_for_exam();

-- Add RLS for new tables
ALTER TABLE exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_product_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Exam templates are viewable by authenticated users" ON exam_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Exam templates are manageable by authenticated users" ON exam_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Digital product templates are viewable by authenticated users" ON digital_product_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Digital product templates are manageable by authenticated users" ON digital_product_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at triggers
CREATE TRIGGER update_exam_templates_updated_at BEFORE UPDATE ON exam_templates
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

CREATE TRIGGER update_digital_product_templates_updated_at BEFORE UPDATE ON digital_product_templates
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Create indexes for performance
CREATE INDEX idx_course_templates_product_type ON course_templates(product_type);
CREATE INDEX idx_course_templates_wset_level ON course_templates(wset_level);
CREATE INDEX idx_course_templates_is_active ON course_templates(is_active) WHERE is_active = true;

CREATE INDEX idx_exam_templates_wset_level ON exam_templates(wset_level);
CREATE INDEX idx_exam_templates_exam_type ON exam_templates(exam_type);
CREATE INDEX idx_exam_templates_is_active ON exam_templates(is_active) WHERE is_active = true;

CREATE INDEX idx_digital_product_templates_category ON digital_product_templates(category);
CREATE INDEX idx_digital_product_templates_wset_level ON digital_product_templates(wset_level) WHERE wset_level IS NOT NULL;
CREATE INDEX idx_digital_product_templates_is_active ON digital_product_templates(is_active) WHERE is_active = true;

-- Add comments for documentation
COMMENT ON TABLE course_templates IS 'Enhanced course templates that auto-generate products when sessions are created';
COMMENT ON TABLE exam_templates IS 'Templates for spot exams that auto-generate products when exams are scheduled';
COMMENT ON TABLE digital_product_templates IS 'Templates for digital and physical products like tasting kits, study materials, merchandise';
COMMENT ON FUNCTION auto_create_product_for_session() IS 'Automatically creates products and syncs pricing when course sessions are scheduled';
COMMENT ON FUNCTION auto_create_product_for_exam() IS 'Automatically creates products when exams are scheduled from templates';