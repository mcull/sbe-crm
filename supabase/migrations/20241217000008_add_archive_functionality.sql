-- Add archive functionality to offerings table
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES candidates(id) ON DELETE SET NULL;
ALTER TABLE offerings ADD COLUMN IF NOT EXISTS archive_reason TEXT NULL;

-- Add index for performance when filtering out archived items
CREATE INDEX IF NOT EXISTS idx_offerings_archived ON offerings(archived) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_offerings_active_not_archived ON offerings(active, archived) WHERE active = true AND archived = false;

-- Add archive functionality to sessions table as well
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES candidates(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archive_reason TEXT NULL;

-- Add index for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_archived ON sessions(archived) WHERE archived = false;

-- Function to archive an offering (soft delete)
CREATE OR REPLACE FUNCTION archive_offering(
  offering_id UUID,
  archived_by_user_id UUID DEFAULT NULL,
  reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE offerings
  SET
    archived = true,
    archived_at = NOW(),
    archived_by = archived_by_user_id,
    archive_reason = reason,
    active = false  -- Also deactivate when archiving
  WHERE id = offering_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to restore an offering from archive
CREATE OR REPLACE FUNCTION restore_offering(
  offering_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE offerings
  SET
    archived = false,
    archived_at = NULL,
    archived_by = NULL,
    archive_reason = NULL,
    active = true  -- Reactivate when restoring
  WHERE id = offering_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to archive a session
CREATE OR REPLACE FUNCTION archive_session(
  session_id UUID,
  archived_by_user_id UUID DEFAULT NULL,
  reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sessions
  SET
    archived = true,
    archived_at = NOW(),
    archived_by = archived_by_user_id,
    archive_reason = reason
  WHERE id = session_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a session from archive
CREATE OR REPLACE FUNCTION restore_session(
  session_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sessions
  SET
    archived = false,
    archived_at = NULL,
    archived_by = NULL,
    archive_reason = NULL
  WHERE id = session_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;