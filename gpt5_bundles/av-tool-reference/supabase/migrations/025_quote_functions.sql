-- ===================================================================
-- Migration: Quote Functions
-- Description: Core business logic functions for quote management
-- Version: 025
-- ===================================================================

-- ===================================================================
-- QUOTE NUMBER GENERATION
-- ===================================================================

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  current_year TEXT;
  year_suffix TEXT;
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  year_suffix := RIGHT(current_year, 2);
  
  -- Find the highest number for this year
  SELECT COALESCE(
    MAX(
      CAST(
        RIGHT(quote_number, 3) AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM quotes
  WHERE quote_number LIKE 'CPQ-' || year_suffix || '%';
  
  -- Format the number with leading zeros
  formatted_number := 'CPQ-' || year_suffix || LPAD(next_number::TEXT, 3, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- QUOTE FINANCIAL CALCULATIONS
-- ===================================================================

CREATE OR REPLACE FUNCTION calculate_quote_totals(quote_id_param UUID)
RETURNS VOID AS $$
DECLARE
  equipment_total DECIMAL(12,2) := 0;
  equipment_cost_total DECIMAL(12,2) := 0;
  labor_total DECIMAL(12,2) := 0;
  labor_cost_total DECIMAL(12,2) := 0;
  shipping_amt DECIMAL(12,2);
  tax_amt DECIMAL(12,2);
  final_total DECIMAL(12,2);
  profit DECIMAL(12,2);
  margin DECIMAL(5,2);
  commission DECIMAL(12,2);
  quote_record RECORD;
BEGIN
  -- Get quote details
  SELECT * INTO quote_record FROM quotes WHERE id = quote_id_param;
  
  -- Calculate equipment totals across all options
  SELECT 
    COALESCE(SUM(qe.line_price), 0),
    COALESCE(SUM(qe.line_cost), 0)
  INTO equipment_total, equipment_cost_total
  FROM quote_equipment qe
  JOIN quote_areas qa ON qe.quote_area_id = qa.id
  JOIN quote_options qo ON qa.quote_option_id = qo.id
  WHERE qo.quote_id = quote_id_param;
  
  -- Calculate labor totals across all options
  SELECT 
    COALESCE(SUM(ql.customer_total), 0),
    COALESCE(SUM(ql.internal_cost), 0)
  INTO labor_total, labor_cost_total
  FROM quote_labor ql
  JOIN quote_options qo ON ql.quote_option_id = qo.id
  WHERE qo.quote_id = quote_id_param;
  
  -- Calculate shipping
  shipping_amt := (equipment_total * quote_record.shipping_percentage / 100);
  
  -- Calculate tax
  IF quote_record.tax_exempt THEN
    tax_amt := 0;
  ELSE
    tax_amt := ((equipment_total + labor_total + shipping_amt) * quote_record.tax_percentage / 100);
  END IF;
  
  -- Calculate final total
  final_total := equipment_total + labor_total + shipping_amt + tax_amt;
  
  -- Calculate profit and margin
  profit := final_total - (equipment_cost_total + labor_cost_total + shipping_amt + tax_amt);
  
  IF final_total > 0 THEN
    margin := (profit / final_total) * 100;
  ELSE
    margin := 0;
  END IF;
  
  -- Calculate commission
  commission := profit * (quote_record.commission_rate / 100);
  
  -- Update quote record
  UPDATE quotes SET
    equipment_subtotal = equipment_total,
    labor_subtotal = labor_total,
    shipping_amount = shipping_amt,
    tax_amount = tax_amt,
    total_amount = final_total,
    equipment_cost = equipment_cost_total,
    labor_cost = labor_cost_total,
    total_cost = equipment_cost_total + labor_cost_total,
    gross_profit = profit,
    gross_profit_margin = margin,
    commission_amount = commission,
    updated_at = NOW()
  WHERE id = quote_id_param;
  
  -- Also update option-level totals
  UPDATE quote_options SET
    equipment_subtotal = (
      SELECT COALESCE(SUM(qe.line_price), 0)
      FROM quote_equipment qe
      JOIN quote_areas qa ON qe.quote_area_id = qa.id
      WHERE qa.quote_option_id = quote_options.id
    ),
    labor_subtotal = (
      SELECT COALESCE(SUM(ql.customer_total), 0)
      FROM quote_labor ql
      WHERE ql.quote_option_id = quote_options.id
    ),
    equipment_cost = (
      SELECT COALESCE(SUM(qe.line_cost), 0)
      FROM quote_equipment qe
      JOIN quote_areas qa ON qe.quote_area_id = qa.id
      WHERE qa.quote_option_id = quote_options.id
    ),
    labor_cost = (
      SELECT COALESCE(SUM(ql.internal_cost), 0)
      FROM quote_labor ql
      WHERE ql.quote_option_id = quote_options.id
    ),
    updated_at = NOW()
  WHERE quote_id = quote_id_param;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- QUOTE STATUS MANAGEMENT
-- ===================================================================

CREATE OR REPLACE FUNCTION update_quote_status(
  quote_id_param UUID,
  new_status quotes_status,
  user_id_param UUID DEFAULT NULL,
  change_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  old_status quotes_status;
  quote_number_val VARCHAR(20);
  quote_record RECORD;
BEGIN
  -- Get current quote data
  SELECT * INTO quote_record FROM quotes WHERE id = quote_id_param;
  old_status := quote_record.status;
  quote_number_val := quote_record.quote_number;
  
  -- Validate status transition
  IF old_status = 'accepted' AND new_status NOT IN ('accepted', 'archived') THEN
    RAISE EXCEPTION 'Cannot change status from accepted to %', new_status;
  END IF;
  
  -- Update the status
  UPDATE quotes SET
    status = new_status,
    updated_at = NOW(),
    updated_by = user_id_param
  WHERE id = quote_id_param;
  
  -- Log the status change
  PERFORM create_audit_log_entry(
    quote_id_param,
    'status_change',
    'quotes',
    quote_id_param,
    jsonb_build_object('status', old_status),
    jsonb_build_object('status', new_status),
    ARRAY['status'],
    user_id_param,
    change_reason
  );
  
  -- Handle special status transitions
  CASE new_status
    WHEN 'sent' THEN
      -- Generate customer access token if not exists
      UPDATE quotes SET
        customer_access_token = COALESCE(customer_access_token, encode(gen_random_bytes(32), 'hex'))
      WHERE id = quote_id_param AND customer_access_token IS NULL;
      
      -- Set expiration date if configured
      IF quote_record.expiration_type != 'never' THEN
        UPDATE quotes SET
          expires_at = CASE quote_record.expiration_type
            WHEN '30_days' THEN NOW() + INTERVAL '30 days'
            WHEN '60_days' THEN NOW() + INTERVAL '60 days'
            WHEN '90_days' THEN NOW() + INTERVAL '90 days'
            ELSE NULL
          END
        WHERE id = quote_id_param AND expires_at IS NULL;
      END IF;
      
    WHEN 'accepted' THEN
      -- Mark acceptance timestamp
      UPDATE quotes SET
        accepted_at = NOW()
      WHERE id = quote_id_param AND accepted_at IS NULL;
      
    ELSE
      -- No special handling for other statuses
      NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- QUOTE SEARCH AND FILTERING
-- ===================================================================

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
    COALESCE(u.raw_user_meta_data->>'full_name', u.email),
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
  LEFT JOIN auth.users u ON q.sales_rep_id = u.id
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

-- ===================================================================
-- QUOTE STATISTICS
-- ===================================================================

CREATE OR REPLACE FUNCTION get_quote_statistics(
  sales_rep_filter UUID DEFAULT NULL,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  total_quotes INTEGER,
  draft_quotes INTEGER,
  sent_quotes INTEGER,
  pending_changes_quotes INTEGER,
  accepted_quotes INTEGER,
  expired_quotes INTEGER,
  total_value DECIMAL(12,2),
  total_profit DECIMAL(12,2),
  average_profit_margin DECIMAL(5,2),
  conversion_rate DECIMAL(5,2)
) AS $$
DECLARE
  sent_count INTEGER;
  accepted_count INTEGER;
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_quotes,
    COUNT(*) FILTER (WHERE status = 'draft')::INTEGER AS draft_quotes,
    COUNT(*) FILTER (WHERE status = 'sent')::INTEGER AS sent_quotes,
    COUNT(*) FILTER (WHERE status = 'pending_changes')::INTEGER AS pending_changes_quotes,
    COUNT(*) FILTER (WHERE status = 'accepted')::INTEGER AS accepted_quotes,
    COUNT(*) FILTER (WHERE status = 'expired')::INTEGER AS expired_quotes,
    COALESCE(SUM(total_amount), 0) AS total_value,
    COALESCE(SUM(gross_profit), 0) AS total_profit,
    COALESCE(AVG(gross_profit_margin), 0) AS average_profit_margin,
    CASE 
      WHEN COUNT(*) FILTER (WHERE status IN ('sent', 'accepted', 'expired')) > 0 
      THEN (COUNT(*) FILTER (WHERE status = 'accepted')::DECIMAL / COUNT(*) FILTER (WHERE status IN ('sent', 'accepted', 'expired'))::DECIMAL * 100)
      ELSE 0 
    END AS conversion_rate
  FROM quotes q
  WHERE 
    (sales_rep_filter IS NULL OR q.sales_rep_id = sales_rep_filter) AND
    (date_from IS NULL OR q.created_at::DATE >= date_from) AND
    (date_to IS NULL OR q.created_at::DATE <= date_to);
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- GRANT PERMISSIONS
-- ===================================================================

GRANT EXECUTE ON FUNCTION generate_quote_number TO authenticated;
GRANT EXECUTE ON FUNCTION generate_quote_number TO service_role;

GRANT EXECUTE ON FUNCTION calculate_quote_totals TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_quote_totals TO service_role;

GRANT EXECUTE ON FUNCTION update_quote_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_quote_status TO service_role;

GRANT EXECUTE ON FUNCTION search_quotes TO authenticated;
GRANT EXECUTE ON FUNCTION search_quotes TO service_role;

GRANT EXECUTE ON FUNCTION get_quote_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_quote_statistics TO service_role;