-- ===================================================================
-- Migration: Create Quote Calculations Function
-- Description: Function to calculate comprehensive quote totals and analytics
-- Version: 031
-- ===================================================================

-- Function to get comprehensive quote calculations
CREATE OR REPLACE FUNCTION get_quote_calculations(quote_id_param UUID)
RETURNS JSON AS $$
DECLARE
  quote_record quotes%ROWTYPE;
  equipment_subtotal DECIMAL(12,2) := 0;
  equipment_cost DECIMAL(12,2) := 0;
  labor_subtotal DECIMAL(12,2) := 0;
  labor_cost DECIMAL(12,2) := 0;
  subtotal DECIMAL(12,2) := 0;
  customer_shipping_amount DECIMAL(12,2) := 0;
  company_shipping_amount DECIMAL(12,2) := 0;
  tax_amount DECIMAL(12,2) := 0;
  total_price DECIMAL(12,2) := 0;
  total_cost DECIMAL(12,2) := 0;
  gross_profit DECIMAL(12,2) := 0;
  profit_margin DECIMAL(5,2) := 0;
  equipment_count INTEGER := 0;
  labor_hours DECIMAL(8,2) := 0;
  result JSON;
BEGIN
  -- Get quote details
  SELECT * INTO quote_record FROM quotes WHERE id = quote_id_param;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Quote not found"}'::JSON;
  END IF;

  -- Calculate equipment totals
  SELECT 
    COALESCE(SUM(line_price), 0),
    COALESCE(SUM(line_cost), 0),
    COALESCE(COUNT(*), 0)
  INTO equipment_subtotal, equipment_cost, equipment_count
  FROM quote_equipment qe
  JOIN quote_areas qa ON qe.quote_area_id = qa.id
  JOIN quote_options qo ON qa.quote_option_id = qo.id
  WHERE qo.quote_id = quote_id_param;

  -- Calculate labor totals (if labor table exists)
  SELECT 
    COALESCE(SUM(customer_price), 0),
    COALESCE(SUM(internal_cost), 0),
    COALESCE(SUM(estimated_hours), 0)
  INTO labor_subtotal, labor_cost, labor_hours
  FROM quote_labor ql
  JOIN quote_options qo ON ql.quote_option_id = qo.id
  WHERE qo.quote_id = quote_id_param;

  -- Calculate subtotal
  subtotal := equipment_subtotal + labor_subtotal;

  -- Calculate shipping amounts
  customer_shipping_amount := subtotal * (quote_record.shipping_percentage / 100.0);
  company_shipping_amount := subtotal * (COALESCE(quote_record.company_shipping_percentage, 2.0) / 100.0);

  -- Calculate tax (on subtotal + shipping)
  IF NOT quote_record.tax_exempt THEN
    tax_amount := (subtotal + customer_shipping_amount) * (quote_record.tax_percentage / 100.0);
  END IF;

  -- Calculate total price
  total_price := subtotal + customer_shipping_amount + tax_amount;

  -- Calculate total cost
  total_cost := equipment_cost + labor_cost + company_shipping_amount;

  -- Calculate profit metrics
  gross_profit := total_price - total_cost;
  
  IF total_price > 0 THEN
    profit_margin := (gross_profit / total_price) * 100.0;
  END IF;

  -- Build result JSON
  result := json_build_object(
    'equipment_subtotal', equipment_subtotal,
    'equipment_cost', equipment_cost,
    'labor_subtotal', labor_subtotal,
    'labor_cost', labor_cost,
    'subtotal', subtotal,
    'customer_shipping_amount', customer_shipping_amount,
    'company_shipping_amount', company_shipping_amount,
    'tax_amount', tax_amount,
    'total_price', total_price,
    'total_cost', total_cost,
    'gross_profit', gross_profit,
    'profit_margin', profit_margin,
    'equipment_count', equipment_count,
    'labor_hours', labor_hours
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_quote_calculations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_quote_calculations(UUID) TO service_role;