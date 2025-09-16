-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_sessions_updated_at BEFORE UPDATE ON course_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_results_updated_at BEFORE UPDATE ON exam_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update enrollment count when enrollments change
CREATE OR REPLACE FUNCTION update_session_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE course_sessions
    SET current_enrollment = (
      SELECT COUNT(*) FROM enrollments
      WHERE course_session_id = NEW.course_session_id
      AND status = 'enrolled'
    )
    WHERE id = NEW.course_session_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE course_sessions
    SET current_enrollment = (
      SELECT COUNT(*) FROM enrollments
      WHERE course_session_id = NEW.course_session_id
      AND status = 'enrolled'
    )
    WHERE id = NEW.course_session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE course_sessions
    SET current_enrollment = (
      SELECT COUNT(*) FROM enrollments
      WHERE course_session_id = OLD.course_session_id
      AND status = 'enrolled'
    )
    WHERE id = OLD.course_session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for enrollment count updates
CREATE TRIGGER update_enrollment_count
  AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_session_enrollment_count();

-- Function to update exam registration count
CREATE OR REPLACE FUNCTION update_exam_registration_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE exams
    SET current_registrations = (
      SELECT COUNT(*) FROM exam_results
      WHERE exam_id = NEW.exam_id
    )
    WHERE id = NEW.exam_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE exams
    SET current_registrations = (
      SELECT COUNT(*) FROM exam_results
      WHERE exam_id = OLD.exam_id
    )
    WHERE id = OLD.exam_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for exam registration count updates
CREATE TRIGGER update_exam_registration_count
  AFTER INSERT OR DELETE ON exam_results
  FOR EACH ROW EXECUTE FUNCTION update_exam_registration_count();