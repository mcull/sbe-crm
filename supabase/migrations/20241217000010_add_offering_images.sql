-- Add image support to offerings table
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS image_alt TEXT;

-- Add index for image queries
CREATE INDEX IF NOT EXISTS idx_offerings_with_images ON offerings(image_url) WHERE image_url IS NOT NULL;

-- Add image metadata fields for better management
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS image_blob_token TEXT; -- Vercel Blob token for management
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS image_upload_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS image_file_size INTEGER; -- in bytes
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS image_content_type TEXT; -- MIME type

COMMENT ON COLUMN offerings.image_url IS 'Public URL to the offering image hosted on Vercel Blob';
COMMENT ON COLUMN offerings.image_alt IS 'Alt text for the offering image for accessibility';
COMMENT ON COLUMN offerings.image_blob_token IS 'Vercel Blob token for image management and deletion';
COMMENT ON COLUMN offerings.image_upload_date IS 'When the current image was uploaded';
COMMENT ON COLUMN offerings.image_file_size IS 'File size in bytes for storage tracking';
COMMENT ON COLUMN offerings.image_content_type IS 'MIME type of the uploaded image';

-- Function to clean up old image metadata when updating
CREATE OR REPLACE FUNCTION update_offering_image_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update metadata when image_url actually changes
  IF NEW.image_url IS DISTINCT FROM OLD.image_url THEN
    NEW.image_upload_date = NOW();
  END IF;

  -- Clear metadata if image is removed
  IF NEW.image_url IS NULL THEN
    NEW.image_alt = NULL;
    NEW.image_blob_token = NULL;
    NEW.image_upload_date = NULL;
    NEW.image_file_size = NULL;
    NEW.image_content_type = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically manage image metadata
DROP TRIGGER IF EXISTS trigger_update_offering_image_metadata ON offerings;
CREATE TRIGGER trigger_update_offering_image_metadata
  BEFORE UPDATE ON offerings
  FOR EACH ROW
  EXECUTE FUNCTION update_offering_image_metadata();