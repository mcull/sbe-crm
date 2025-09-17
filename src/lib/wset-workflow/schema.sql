-- WSET Workflow Database Schema
-- Extends existing SBE CRM schema with workflow automation tables

-- WSET Candidates (extends basic candidates with workflow-specific data)
CREATE TABLE IF NOT EXISTS public.wset_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Link to existing candidate record
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,

  -- Squarespace order information
  squarespace_order_id VARCHAR NOT NULL,
  order_number VARCHAR NOT NULL,

  -- Course and exam details
  course_type VARCHAR NOT NULL,
  course_level INTEGER NOT NULL CHECK (course_level >= 1 AND course_level <= 4),
  exam_date DATE NOT NULL,
  exam_type VARCHAR NOT NULL CHECK (exam_type IN ('PDF', 'RI')),

  -- Additional candidate details for WSET forms
  birthdate DATE,
  gender VARCHAR,
  full_address TEXT NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(squarespace_order_id)
);

-- WSET Exam Orders (groups candidates for submission to WSET)
CREATE TABLE IF NOT EXISTS public.wset_exam_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Order reference (e.g., "L1W-July19,2025")
  reference_number VARCHAR NOT NULL UNIQUE,

  -- Exam details
  exam_type VARCHAR NOT NULL CHECK (exam_type IN ('PDF', 'RI')),
  exam_date DATE NOT NULL,
  exam_time TIME,
  course_level INTEGER NOT NULL CHECK (course_level >= 1 AND course_level <= 4),
  venue TEXT NOT NULL,
  number_of_candidates INTEGER NOT NULL DEFAULT 0,

  -- Status tracking
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'confirmed', 'completed')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  wset_confirmation_date DATE,

  -- Generated document paths
  exam_order_pdf_path VARCHAR,
  candidate_registration_path VARCHAR,

  -- Metadata
  created_by UUID REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link candidates to exam orders
CREATE TABLE IF NOT EXISTS public.wset_exam_order_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_order_id UUID NOT NULL REFERENCES public.wset_exam_orders(id) ON DELETE CASCADE,
  wset_candidate_id UUID NOT NULL REFERENCES public.wset_candidates(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(exam_order_id, wset_candidate_id)
);

-- WSET Workflow State Tracking
CREATE TABLE IF NOT EXISTS public.wset_workflow_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Order reference
  squarespace_order_id VARCHAR NOT NULL UNIQUE,
  wset_candidate_id UUID REFERENCES public.wset_candidates(id) ON DELETE CASCADE,
  exam_order_id UUID REFERENCES public.wset_exam_orders(id) ON DELETE SET NULL,

  -- Overall status
  status VARCHAR DEFAULT 'received' CHECK (status IN (
    'received', 'processing', 'forms_generated', 'submitted',
    'confirmed', 'completed', 'error'
  )),

  -- Workflow step completion
  step_order_received BOOLEAN DEFAULT FALSE,
  step_order_received_at TIMESTAMP WITH TIME ZONE,

  step_candidate_created BOOLEAN DEFAULT FALSE,
  step_candidate_created_at TIMESTAMP WITH TIME ZONE,

  step_forms_generated BOOLEAN DEFAULT FALSE,
  step_forms_generated_at TIMESTAMP WITH TIME ZONE,

  step_wset_submitted BOOLEAN DEFAULT FALSE,
  step_wset_submitted_at TIMESTAMP WITH TIME ZONE,

  step_wset_confirmed BOOLEAN DEFAULT FALSE,
  step_wset_confirmed_at TIMESTAMP WITH TIME ZONE,

  step_results_received BOOLEAN DEFAULT FALSE,
  step_results_received_at TIMESTAMP WITH TIME ZONE,

  step_certificates_distributed BOOLEAN DEFAULT FALSE,
  step_certificates_distributed_at TIMESTAMP WITH TIME ZONE,

  -- Manual review flags
  requires_review BOOLEAN DEFAULT FALSE,
  review_reason TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Error tracking
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WSET Email Communications
CREATE TABLE IF NOT EXISTS public.wset_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Email details
  to_email VARCHAR NOT NULL,
  from_email VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  body TEXT NOT NULL,

  -- References
  exam_order_id UUID REFERENCES public.wset_exam_orders(id) ON DELETE CASCADE,
  workflow_state_id UUID REFERENCES public.wset_workflow_states(id) ON DELETE CASCADE,

  -- Status
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'error')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- External email service ID (for tracking)
  external_id VARCHAR,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Attachments
CREATE TABLE IF NOT EXISTS public.wset_email_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id UUID NOT NULL REFERENCES public.wset_emails(id) ON DELETE CASCADE,

  filename VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  content_type VARCHAR NOT NULL,
  file_size INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WSET Form Templates
CREATE TABLE IF NOT EXISTS public.wset_form_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Template identification
  template_type VARCHAR NOT NULL CHECK (template_type IN (
    'exam_order_pdf', 'exam_order_ri', 'candidate_registration'
  )),
  course_level INTEGER NOT NULL CHECK (course_level >= 1 AND course_level <= 4),

  -- Template details
  template_name VARCHAR NOT NULL,
  template_path VARCHAR NOT NULL,
  required_fields JSONB NOT NULL DEFAULT '[]',

  -- Versioning
  version VARCHAR DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(template_type, course_level, version)
);

-- Audit log for workflow actions
CREATE TABLE IF NOT EXISTS public.wset_workflow_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- References
  workflow_state_id UUID REFERENCES public.wset_workflow_states(id) ON DELETE CASCADE,
  exam_order_id UUID REFERENCES public.wset_exam_orders(id) ON DELETE SET NULL,

  -- Action details
  action VARCHAR NOT NULL,
  details JSONB,

  -- User context
  performed_by UUID REFERENCES public.users(id),
  automated BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wset_candidates_squarespace_order ON public.wset_candidates(squarespace_order_id);
CREATE INDEX IF NOT EXISTS idx_wset_candidates_exam_date ON public.wset_candidates(exam_date);
CREATE INDEX IF NOT EXISTS idx_wset_exam_orders_status ON public.wset_exam_orders(status);
CREATE INDEX IF NOT EXISTS idx_wset_exam_orders_exam_date ON public.wset_exam_orders(exam_date);
CREATE INDEX IF NOT EXISTS idx_wset_workflow_states_status ON public.wset_workflow_states(status);
CREATE INDEX IF NOT EXISTS idx_wset_workflow_states_requires_review ON public.wset_workflow_states(requires_review);
CREATE INDEX IF NOT EXISTS idx_wset_emails_status ON public.wset_emails(status);
CREATE INDEX IF NOT EXISTS idx_wset_workflow_logs_created_at ON public.wset_workflow_logs(created_at);

-- Create updated_at triggers
CREATE TRIGGER update_wset_candidates_updated_at
  BEFORE UPDATE ON public.wset_candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wset_exam_orders_updated_at
  BEFORE UPDATE ON public.wset_exam_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wset_workflow_states_updated_at
  BEFORE UPDATE ON public.wset_workflow_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wset_emails_updated_at
  BEFORE UPDATE ON public.wset_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wset_form_templates_updated_at
  BEFORE UPDATE ON public.wset_form_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();