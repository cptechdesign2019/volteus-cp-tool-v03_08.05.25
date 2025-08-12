-- ===================================================================
-- Migration: Fix Search Quotes Function
-- Description: Remove auth.users dependency that causes permission errors
-- Version: 026
-- ===================================================================

-- Replace the search_quotes function to remove auth.users dependency
CREATE OR REPLACE FUNCTION search_quotes(
  search_term TEXT DEFAULT NULL,
  status_filter quotes_status DEFAULT NULL,
  sales_rep_filter UUID DEFAULT NULL,
  customer_filter UUID DEFAULT NULL,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  quote_id UUID,
  quote_number VARCHAR(20),
  customer_name VARCHAR(255),
  customer_company VARCHAR(255),
  sales_rep_name VARCHAR(200),
  status quotes_status,
  total_amount DECIMAL(12,2),
  gross_profit DECIMAL(12,2),
  gross_profit_margin DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.quote_number,
    COALESCE(cc.contact_name, 'Unknown Contact'),
    ca.company_name,
    'Sales Rep' as sales_rep_name,  -- Placeholder for now, TODO: integrate with proper user system
    q.status,
    q.total_amount,
    q.gross_profit,
    q.gross_profit_margin,
    q.created_at,
    q.updated_at,
    q.expires_at
  FROM quotes q
  LEFT JOIN customer_accounts ca ON q.customer_account_id = ca.id
  LEFT JOIN customer_contacts cc ON ca.id = cc.customer_account_id AND cc.is_primary_contact = true
  WHERE 
    (search_term IS NULL OR (
      q.quote_number ILIKE '%' || search_term || '%' OR
      ca.company_name ILIKE '%' || search_term || '%' OR
      cc.contact_name ILIKE '%' || search_term || '%' OR
      q.title ILIKE '%' || search_term || '%'
    )) AND
    (status_filter IS NULL OR q.status = status_filter) AND
    (sales_rep_filter IS NULL OR q.sales_rep_id = sales_rep_filter) AND
    (customer_filter IS NULL OR q.customer_account_id = customer_filter) AND
    (date_from IS NULL OR q.created_at::DATE >= date_from) AND
    (date_to IS NULL OR q.created_at::DATE <= date_to)
  ORDER BY q.updated_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_quotes TO authenticated;
GRANT EXECUTE ON FUNCTION search_quotes TO service_role;