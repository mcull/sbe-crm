-- Add linked_course_offering_id to sessions table for exam-course relationships
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS linked_course_offering_id UUID REFERENCES offerings(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_linked_course_offering_id ON sessions(linked_course_offering_id);

-- Add comment to document the relationship
COMMENT ON COLUMN sessions.linked_course_offering_id IS 'Links an exam session to a specific course offering. Used for retakes, transfers, and tracking course completion rates.';

-- Update the auto-create product function to handle course linkage in metadata
CREATE OR REPLACE FUNCTION auto_create_product_for_session()
RETURNS TRIGGER AS $$
DECLARE
  offering_record RECORD;
  linked_course_record RECORD;
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

  -- Get linked course details if exists
  IF NEW.linked_course_offering_id IS NOT NULL THEN
    SELECT * INTO linked_course_record
    FROM offerings
    WHERE id = NEW.linked_course_offering_id;
  END IF;

  -- Generate intelligent product name
  IF NEW.name IS NOT NULL THEN
    product_name := NEW.name;
  ELSE
    product_name := offering_record.name || ' - ' || TO_CHAR(NEW.session_date, 'Mon DD, YYYY');

    -- Add course reference for linked exams
    IF linked_course_record IS NOT NULL THEN
      product_name := product_name || ' (' || linked_course_record.name || ')';
    ELSIF NEW.location IS NOT NULL THEN
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

  -- Add course linkage information
  IF linked_course_record IS NOT NULL THEN
    product_description := product_description || E'\n• Related Course: ' || linked_course_record.name;
    product_description := product_description || E'\n• Suitable for students who completed the course or need retakes';
  END IF;

  product_description := product_description || E'\n• Capacity: ' || NEW.max_capacity || ' spots';
  product_description := product_description || E'\n• Delivery: ' || REPLACE(NEW.delivery_method::TEXT, '_', ' ');

  -- Calculate early bird price
  early_bird_price := ROUND(offering_record.base_price * (100 - COALESCE(NEW.early_bird_discount_percent, 0)) / 100.0, 2);

  -- Build comprehensive metadata including course linkage
  product_metadata := offering_record.metadata || jsonb_build_object(
    'offering_type', offering_record.type,
    'wset_level', offering_record.wset_level,
    'session_id', NEW.id,
    'offering_id', offering_record.id,
    'linked_course_offering_id', NEW.linked_course_offering_id,
    'linked_course_name', CASE WHEN linked_course_record IS NOT NULL THEN linked_course_record.name ELSE NULL END,
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
    'auto_generated', true,
    'stripe_metadata', jsonb_build_object(
      'offering_type', offering_record.type,
      'session_id', NEW.id,
      'wset_level', offering_record.wset_level,
      'linked_to_course', CASE WHEN NEW.linked_course_offering_id IS NOT NULL THEN 'true' ELSE 'false' END
    )
  );

  -- Insert the auto-generated product
  INSERT INTO products (
    name,
    description,
    type,
    base_price,
    sale_price,
    category,
    metadata,
    active,
    auto_generated,
    session_id,
    offering_id
  ) VALUES (
    product_name,
    product_description,
    CASE
      WHEN offering_record.type = 'tasting' THEN 'experience'
      WHEN offering_record.type = 'wset_course' THEN 'course'
      WHEN offering_record.type = 'standalone_exam' THEN 'spot_exam'
      ELSE 'course'
    END,
    offering_record.base_price,
    early_bird_price,
    'education',
    product_metadata,
    true,
    true,
    NEW.id,
    NEW.offering_id
  ) RETURNING id INTO new_product_id;

  -- Update the session with the generated product ID
  UPDATE sessions SET product_id = new_product_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;