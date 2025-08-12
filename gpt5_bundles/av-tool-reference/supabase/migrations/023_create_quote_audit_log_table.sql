-- ===================================================================
-- Migration: Create Quote Audit Log Table
-- Description: Complete audit trail of quote changes and status updates
-- Version: 023
-- ===================================================================

-- Create custom types for audit log
CREATE TYPE audit_action_type AS ENUM ('create', 'update', 'delete', 'status_change', 'email_sent', 'customer_view', 'acceptance', 'rejection');

-- Create quote_audit_log table
CREATE TABLE quote_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Change tracking
  action_type audit_action_type NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  
  -- Change details
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Context
  user_id UUID REFERENCES auth.users(id),
  user_ip_address INET,
  user_agent TEXT,
  change_reason VARCHAR(500),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_quote_audit_quote ON quote_audit_log(quote_id);
CREATE INDEX idx_quote_audit_user ON quote_audit_log(user_id);
CREATE INDEX idx_quote_audit_action ON quote_audit_log(action_type);
CREATE INDEX idx_quote_audit_created ON quote_audit_log(created_at DESC);
CREATE INDEX idx_quote_audit_table ON quote_audit_log(table_name);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log_entry(
  p_quote_id UUID,
  p_action_type audit_action_type,
  p_table_name VARCHAR(100),
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_changed_fields TEXT[] DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_change_reason VARCHAR(500) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO quote_audit_log (
    quote_id,
    action_type,
    table_name,
    record_id,
    old_values,
    new_values,
    changed_fields,
    user_id,
    change_reason
  ) VALUES (
    p_quote_id,
    p_action_type,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    p_changed_fields,
    p_user_id,
    p_change_reason
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON quote_audit_log TO authenticated;
GRANT ALL ON quote_audit_log TO service_role;
GRANT EXECUTE ON FUNCTION create_audit_log_entry TO authenticated;
GRANT EXECUTE ON FUNCTION create_audit_log_entry TO service_role;