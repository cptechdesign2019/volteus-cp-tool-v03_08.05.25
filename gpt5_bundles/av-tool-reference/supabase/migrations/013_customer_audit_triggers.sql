-- Migration: Audit triggers for customer data changes
-- Created: 2025-01-01
-- Purpose: Track all changes to customer data for audit and compliance

BEGIN;

-- Create audit log table for customer accounts
CREATE TABLE customer_accounts_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL DEFAULT 'customer_accounts',
  record_id UUID NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit log table for customer contacts
CREATE TABLE customer_contacts_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL DEFAULT 'customer_contacts',
  record_id UUID NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for audit tables
CREATE INDEX idx_customer_accounts_audit_record_id ON customer_accounts_audit(record_id);
CREATE INDEX idx_customer_accounts_audit_changed_at ON customer_accounts_audit(changed_at);
CREATE INDEX idx_customer_accounts_audit_changed_by ON customer_accounts_audit(changed_by);
CREATE INDEX idx_customer_accounts_audit_operation ON customer_accounts_audit(operation);

CREATE INDEX idx_customer_contacts_audit_record_id ON customer_contacts_audit(record_id);
CREATE INDEX idx_customer_contacts_audit_changed_at ON customer_contacts_audit(changed_at);
CREATE INDEX idx_customer_contacts_audit_changed_by ON customer_contacts_audit(changed_by);
CREATE INDEX idx_customer_contacts_audit_operation ON customer_contacts_audit(operation);

-- Function to audit customer_accounts changes
CREATE OR REPLACE FUNCTION audit_customer_accounts_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[] := ARRAY[]::TEXT[];
  field_name TEXT;
BEGIN
  -- For UPDATE operations, identify changed fields
  IF TG_OP = 'UPDATE' THEN
    -- Check each field for changes
    IF OLD.company_name IS DISTINCT FROM NEW.company_name THEN
      changed_fields := array_append(changed_fields, 'company_name');
    END IF;
    IF OLD.customer_type IS DISTINCT FROM NEW.customer_type THEN
      changed_fields := array_append(changed_fields, 'customer_type');
    END IF;
    IF OLD.billing_address IS DISTINCT FROM NEW.billing_address THEN
      changed_fields := array_append(changed_fields, 'billing_address');
    END IF;
    IF OLD.service_address IS DISTINCT FROM NEW.service_address THEN
      changed_fields := array_append(changed_fields, 'service_address');
    END IF;
    IF OLD.account_notes IS DISTINCT FROM NEW.account_notes THEN
      changed_fields := array_append(changed_fields, 'account_notes');
    END IF;
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN
      changed_fields := array_append(changed_fields, 'tags');
    END IF;
  END IF;

  -- Insert audit record
  INSERT INTO customer_accounts_audit (
    record_id,
    operation,
    old_data,
    new_data,
    changed_fields,
    changed_by
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    changed_fields,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to audit customer_contacts changes
CREATE OR REPLACE FUNCTION audit_customer_contacts_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- For UPDATE operations, identify changed fields
  IF TG_OP = 'UPDATE' THEN
    -- Check each field for changes
    IF OLD.customer_account_id IS DISTINCT FROM NEW.customer_account_id THEN
      changed_fields := array_append(changed_fields, 'customer_account_id');
    END IF;
    IF OLD.contact_name IS DISTINCT FROM NEW.contact_name THEN
      changed_fields := array_append(changed_fields, 'contact_name');
    END IF;
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      changed_fields := array_append(changed_fields, 'email');
    END IF;
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
      changed_fields := array_append(changed_fields, 'phone');
    END IF;
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      changed_fields := array_append(changed_fields, 'role');
    END IF;
    IF OLD.is_primary_contact IS DISTINCT FROM NEW.is_primary_contact THEN
      changed_fields := array_append(changed_fields, 'is_primary_contact');
    END IF;
    IF OLD.contact_notes IS DISTINCT FROM NEW.contact_notes THEN
      changed_fields := array_append(changed_fields, 'contact_notes');
    END IF;
  END IF;

  -- Insert audit record
  INSERT INTO customer_contacts_audit (
    record_id,
    operation,
    old_data,
    new_data,
    changed_fields,
    changed_by
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    changed_fields,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for customer_accounts
CREATE TRIGGER customer_accounts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION audit_customer_accounts_changes();

-- Create audit triggers for customer_contacts
CREATE TRIGGER customer_contacts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customer_contacts
  FOR EACH ROW
  EXECUTE FUNCTION audit_customer_contacts_changes();

-- Function to get audit history for a customer account
CREATE OR REPLACE FUNCTION get_customer_audit_history(customer_id UUID)
RETURNS TABLE (
  change_id UUID,
  table_name TEXT,
  operation TEXT,
  changed_fields TEXT[],
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE,
  old_data JSONB,
  new_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    audit.id as change_id,
    audit.table_name,
    audit.operation,
    audit.changed_fields,
    audit.changed_by,
    audit.changed_at,
    audit.old_data,
    audit.new_data
  FROM (
    -- Customer account changes
    SELECT caa.id, caa.table_name, caa.operation, caa.changed_fields, caa.changed_by, caa.changed_at, caa.old_data, caa.new_data
    FROM customer_accounts_audit caa
    WHERE caa.record_id = customer_id
    
    UNION ALL
    
    -- Customer contact changes
    SELECT cca.id, cca.table_name, cca.operation, cca.changed_fields, cca.changed_by, cca.changed_at, cca.old_data, cca.new_data
    FROM customer_contacts_audit cca
    WHERE cca.record_id IN (
      SELECT cc.id FROM customer_contacts cc WHERE cc.customer_account_id = customer_id
    )
  ) audit
  ORDER BY audit.changed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON customer_accounts_audit TO authenticated;
GRANT SELECT ON customer_contacts_audit TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_audit_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION audit_customer_accounts_changes() TO authenticated;
GRANT EXECUTE ON FUNCTION audit_customer_contacts_changes() TO authenticated;

COMMIT;