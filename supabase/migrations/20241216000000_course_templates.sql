-- Create course_templates table
CREATE TABLE course_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wset_level INTEGER NOT NULL UNIQUE CHECK (wset_level >= 1 AND wset_level <= 4),
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 1 CHECK (duration_weeks >= 1),
  max_capacity INTEGER NOT NULL DEFAULT 20 CHECK (max_capacity >= 1),
  price DECIMAL(10,2) CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default WSET course templates
INSERT INTO course_templates (wset_level, name, description, duration_weeks, max_capacity, price) VALUES
(1, 'WSET Level 1 Award in Wines', 'An introductory course for wine novices, covering the basic principles of wine and wine tasting.', 1, 16, NULL),
(2, 'WSET Level 2 Award in Wines', 'For those with some knowledge who want to understand wine in greater depth.', 2, 20, NULL),
(3, 'WSET Level 3 Award in Wines', 'A comprehensive study of wines suitable for wine professionals and serious enthusiasts.', 6, 18, NULL),
(4, 'WSET Level 4 Diploma in Wines', 'The most advanced qualification for wine professionals, covering viticulture, winemaking, and business.', 52, 12, NULL);

-- Enable RLS
ALTER TABLE course_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to view course templates" ON course_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage course templates" ON course_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_course_templates_updated_at BEFORE UPDATE ON course_templates
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);