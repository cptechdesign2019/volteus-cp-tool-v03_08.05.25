-- Migration: Additional search optimization indexes for customer data
-- Created: 2025-01-01
-- Purpose: Enhance search performance for customer management features

BEGIN;

-- Additional composite indexes for common query patterns

-- Index for customer search by type and creation date (for dashboard stats)
CREATE INDEX idx_customer_accounts_type_created_at ON customer_accounts(customer_type, created_at);

-- Index for customer search by name pattern matching (case-insensitive)
CREATE INDEX idx_customer_accounts_company_name_lower ON customer_accounts(LOWER(company_name));

-- Index for contact search by name pattern matching (case-insensitive)
CREATE INDEX idx_customer_contacts_contact_name_lower ON customer_contacts(LOWER(contact_name));

-- Index for email search (case-insensitive)
CREATE INDEX idx_customer_contacts_email_lower ON customer_contacts(LOWER(email));

-- Composite index for finding contacts by account and role
CREATE INDEX idx_customer_contacts_account_role ON customer_contacts(customer_account_id, role);

-- Index for customers with recent activity (for dashboard "recent additions")
-- Note: This will be managed by the application logic instead of a partial index
CREATE INDEX idx_customer_accounts_created_at_desc ON customer_accounts(created_at DESC);

-- Partial index for primary contacts only (faster lookup)
CREATE INDEX idx_customer_contacts_primary_only ON customer_contacts(customer_account_id) WHERE is_primary_contact = true;

-- Index for customers with tags (for filtering)
CREATE INDEX idx_customer_accounts_has_tags ON customer_accounts(id) WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- Create a view for customer search that joins accounts with primary contact
CREATE OR REPLACE VIEW customer_search_view AS
SELECT 
  ca.id,
  ca.company_name,
  ca.customer_type,
  ca.billing_address,
  ca.service_address,
  ca.account_notes,
  ca.tags,
  ca.created_at,
  ca.updated_at,
  cc.contact_name as primary_contact_name,
  cc.email as primary_contact_email,
  cc.phone as primary_contact_phone,
  cc.role as primary_contact_role
FROM customer_accounts ca
LEFT JOIN customer_contacts cc ON ca.id = cc.customer_account_id AND cc.is_primary_contact = true;

-- Grant permissions on the view
GRANT SELECT ON customer_search_view TO authenticated;

-- Create a function for customer statistics
CREATE OR REPLACE FUNCTION get_customer_statistics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_customers', COUNT(*),
    'residential_count', COUNT(*) FILTER (WHERE customer_type = 'Residential'),
    'commercial_count', COUNT(*) FILTER (WHERE customer_type = 'Commercial'),
    'recent_additions', COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'),
    'with_multiple_contacts', COUNT(*) FILTER (WHERE (
      SELECT COUNT(*) FROM customer_contacts cc WHERE cc.customer_account_id = customer_accounts.id
    ) > 1)
  )
  INTO result
  FROM customer_accounts;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission on the statistics function
GRANT EXECUTE ON FUNCTION get_customer_statistics() TO authenticated;

-- Create a function for customer search with pagination
CREATE OR REPLACE FUNCTION search_customers(
  search_term TEXT DEFAULT NULL,
  customer_type_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  company_name VARCHAR(255),
  customer_type VARCHAR(20),
  billing_address JSONB,
  service_address JSONB,
  account_notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(50),
  primary_contact_role VARCHAR(100),
  total_contacts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csv.id,
    csv.company_name,
    csv.customer_type,
    csv.billing_address,
    csv.service_address,
    csv.account_notes,
    csv.tags,
    csv.created_at,
    csv.updated_at,
    csv.primary_contact_name,
    csv.primary_contact_email,
    csv.primary_contact_phone,
    csv.primary_contact_role,
    (SELECT COUNT(*)::INTEGER FROM customer_contacts cc WHERE cc.customer_account_id = csv.id) as total_contacts
  FROM customer_search_view csv
  WHERE 
    (search_term IS NULL OR 
     LOWER(csv.company_name) LIKE LOWER('%' || search_term || '%') OR
     LOWER(csv.primary_contact_name) LIKE LOWER('%' || search_term || '%') OR
     LOWER(csv.primary_contact_email) LIKE LOWER('%' || search_term || '%')
    )
    AND (customer_type_filter IS NULL OR csv.customer_type = customer_type_filter)
  ORDER BY csv.updated_at DESC, csv.company_name
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission on the search function
GRANT EXECUTE ON FUNCTION search_customers(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

COMMIT;