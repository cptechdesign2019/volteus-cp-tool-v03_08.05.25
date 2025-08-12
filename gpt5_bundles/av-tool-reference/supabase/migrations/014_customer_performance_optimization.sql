-- Migration: Customer Management Performance Optimization
-- Created: 2025-01-01
-- Purpose: Advanced performance optimizations for customer management features

BEGIN;

-- Full-text search indexes using GIN for better search performance
CREATE INDEX IF NOT EXISTS idx_customer_accounts_fulltext ON customer_accounts 
USING GIN (to_tsvector('english', company_name || ' ' || COALESCE(account_notes, '')));

CREATE INDEX IF NOT EXISTS idx_customer_contacts_fulltext ON customer_contacts 
USING GIN (to_tsvector('english', contact_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(role, '')));

-- Composite indexes for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_customer_accounts_type_created_billing ON customer_accounts(customer_type, created_at DESC, billing_address);

-- Index for customer search by location (billing address components)
CREATE INDEX IF NOT EXISTS idx_customer_accounts_billing_city ON customer_accounts USING GIN ((billing_address->'city'));
CREATE INDEX IF NOT EXISTS idx_customer_accounts_billing_state ON customer_accounts USING GIN ((billing_address->'state'));

-- Additional composite index for performance
CREATE INDEX IF NOT EXISTS idx_customer_accounts_id_created ON customer_accounts(id, created_at DESC);

-- Index for customers with service addresses different from billing
CREATE INDEX IF NOT EXISTS idx_customer_accounts_service_address ON customer_accounts(id) 
WHERE service_address IS NOT NULL AND service_address != billing_address;

-- Enhanced customer search function with full-text search
CREATE OR REPLACE FUNCTION search_customers_fulltext(
  search_term TEXT DEFAULT NULL,
  customer_type_filter TEXT DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
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
  total_contacts INTEGER,
  search_rank REAL
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
    (SELECT COUNT(*)::INTEGER FROM customer_contacts cc WHERE cc.customer_account_id = csv.id) as total_contacts,
    CASE 
      WHEN search_term IS NULL THEN 0::REAL
      ELSE ts_rank(
        to_tsvector('english', csv.company_name || ' ' || COALESCE(csv.account_notes, '') || ' ' || 
                   COALESCE(csv.primary_contact_name, '') || ' ' || COALESCE(csv.primary_contact_email, '')),
        plainto_tsquery('english', search_term)
      )
    END as search_rank
  FROM customer_search_view csv
  WHERE 
    (search_term IS NULL OR 
     to_tsvector('english', csv.company_name || ' ' || COALESCE(csv.account_notes, '') || ' ' || 
                COALESCE(csv.primary_contact_name, '') || ' ' || COALESCE(csv.primary_contact_email, ''))
     @@ plainto_tsquery('english', search_term)
    )
    AND (customer_type_filter IS NULL OR csv.customer_type = customer_type_filter)
    AND (location_filter IS NULL OR 
         LOWER(csv.billing_address->>'city') LIKE LOWER('%' || location_filter || '%') OR
         LOWER(csv.billing_address->>'state') LIKE LOWER('%' || location_filter || '%'))
  ORDER BY 
    CASE WHEN search_term IS NULL THEN csv.updated_at END DESC,
    CASE WHEN search_term IS NOT NULL THEN search_rank END DESC,
    csv.company_name
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission on the enhanced search function
GRANT EXECUTE ON FUNCTION search_customers_fulltext(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

-- Create a function to get search suggestions based on partial input
CREATE OR REPLACE FUNCTION get_customer_search_suggestions(
  partial_term TEXT,
  suggestion_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  suggestion TEXT,
  suggestion_type TEXT,
  customer_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH company_suggestions AS (
    SELECT DISTINCT 
      ca.company_name as suggestion,
      'company'::TEXT as suggestion_type,
      1 as customer_count
    FROM customer_accounts ca
    WHERE LOWER(ca.company_name) LIKE LOWER(partial_term || '%')
    ORDER BY ca.company_name
    LIMIT suggestion_limit
  ),
  contact_suggestions AS (
    SELECT DISTINCT 
      cc.contact_name as suggestion,
      'contact'::TEXT as suggestion_type,
      1 as customer_count
    FROM customer_contacts cc
    WHERE LOWER(cc.contact_name) LIKE LOWER(partial_term || '%')
    ORDER BY cc.contact_name
    LIMIT suggestion_limit
  ),
  city_suggestions AS (
    SELECT DISTINCT 
      (ca.billing_address->>'city') as suggestion,
      'city'::TEXT as suggestion_type,
      COUNT(*)::INTEGER as customer_count
    FROM customer_accounts ca
    WHERE LOWER(ca.billing_address->>'city') LIKE LOWER(partial_term || '%')
      AND ca.billing_address->>'city' IS NOT NULL
    GROUP BY ca.billing_address->>'city'
    ORDER BY customer_count DESC, suggestion
    LIMIT suggestion_limit
  )
  SELECT * FROM company_suggestions
  UNION ALL
  SELECT * FROM contact_suggestions
  UNION ALL
  SELECT * FROM city_suggestions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission on the suggestions function
GRANT EXECUTE ON FUNCTION get_customer_search_suggestions(TEXT, INTEGER) TO authenticated;

-- Create materialized view for customer analytics (refreshed periodically)
CREATE MATERIALIZED VIEW customer_analytics_summary AS
SELECT 
  customer_type,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as customer_count,
  COUNT(CASE WHEN tags IS NOT NULL AND array_length(tags, 1) > 0 THEN 1 END) as customers_with_tags,
  AVG(CASE WHEN billing_address IS NOT NULL THEN 1 ELSE 0 END) as avg_billing_completeness,
  COUNT(CASE WHEN service_address IS NOT NULL THEN 1 END) as customers_with_service_address
FROM customer_accounts
GROUP BY customer_type, DATE_TRUNC('month', created_at)
ORDER BY month DESC, customer_type;

-- Create index on the materialized view
CREATE INDEX idx_customer_analytics_month_type ON customer_analytics_summary(month DESC, customer_type);

-- Grant select permission on the materialized view
GRANT SELECT ON customer_analytics_summary TO authenticated;

-- Function to refresh customer analytics
CREATE OR REPLACE FUNCTION refresh_customer_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW customer_analytics_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission on the refresh function
GRANT EXECUTE ON FUNCTION refresh_customer_analytics() TO authenticated;

COMMIT;