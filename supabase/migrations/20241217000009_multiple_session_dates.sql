-- Add support for multiple session dates
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_dates JSONB;

-- Add index for querying session dates
CREATE INDEX IF NOT EXISTS idx_sessions_session_dates ON sessions USING GIN (session_dates);

-- Function to extract all session dates for queries
CREATE OR REPLACE FUNCTION extract_session_dates(session_dates_json JSONB)
RETURNS SETOF TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  IF session_dates_json IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT (date_entry->>'date')::TIMESTAMP WITH TIME ZONE
  FROM jsonb_array_elements(session_dates_json) AS date_entry;
END;
$$ LANGUAGE plpgsql;

-- Function to get next session date
CREATE OR REPLACE FUNCTION get_next_session_date(session_dates_json JSONB)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  next_date TIMESTAMP WITH TIME ZONE;
BEGIN
  IF session_dates_json IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT MIN((date_entry->>'date')::TIMESTAMP WITH TIME ZONE)
  INTO next_date
  FROM jsonb_array_elements(session_dates_json) AS date_entry
  WHERE (date_entry->>'date')::TIMESTAMP WITH TIME ZONE >= NOW();

  RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get session date range (first to last)
CREATE OR REPLACE FUNCTION get_session_date_range(session_dates_json JSONB)
RETURNS TABLE(start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  IF session_dates_json IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    MIN((date_entry->>'date')::TIMESTAMP WITH TIME ZONE) as start_date,
    MAX(COALESCE((date_entry->>'end_time')::TIMESTAMP WITH TIME ZONE, (date_entry->>'date')::TIMESTAMP WITH TIME ZONE)) as end_date
  FROM jsonb_array_elements(session_dates_json) AS date_entry;
END;
$$ LANGUAGE plpgsql;

-- Update existing sessions to use the new format (convert single date to array)
UPDATE sessions
SET session_dates = jsonb_build_array(
  jsonb_build_object(
    'date', session_date,
    'end_time', end_date,
    'location', location,
    'instructor', instructor,
    'notes', 'Converted from single date format'
  )
)
WHERE session_dates IS NULL AND session_date IS NOT NULL;

COMMENT ON COLUMN sessions.session_dates IS 'Array of session dates with format: [{"date": "2025-01-15T09:00:00Z", "end_time": "2025-01-15T17:00:00Z", "location": "Room A", "instructor": "John Doe", "notes": "Day 1: Introduction"}]';