-- ===================================================================
-- Migration: Create Quote RPC Functions
-- Description: Create RPC functions to bypass RLS issues for quote access
-- Version: 034
-- ===================================================================

-- Function to get quote with options (bypasses RLS)
CREATE OR REPLACE FUNCTION get_quote_with_options(quote_id uuid)
RETURNS TABLE (
  id uuid,
  quote_number varchar,
  customer_account_id uuid,
  sales_rep_id uuid,
  title varchar,
  description text,
  status varchar,
  quote_options json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.quote_number,
    q.customer_account_id,
    q.sales_rep_id,
    q.title,
    q.description,
    q.status,
    COALESCE(
      json_agg(
        json_build_object(
          'id', qo.id,
          'option_name', qo.option_name,
          'option_description', qo.option_description,
          'is_primary', qo.is_primary
        )
      ) FILTER (WHERE qo.id IS NOT NULL),
      '[]'::json
    ) as quote_options
  FROM quotes q
  LEFT JOIN quote_options qo ON qo.quote_id = q.id
  WHERE q.id = quote_id
  GROUP BY q.id, q.quote_number, q.customer_account_id, q.sales_rep_id, q.title, q.description, q.status;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_quote_with_options(uuid) TO authenticated;

-- Function to get quote areas (bypasses RLS)
CREATE OR REPLACE FUNCTION get_quote_areas_rpc(p_quote_id uuid)
RETURNS TABLE (
  id uuid,
  quote_option_id uuid,
  area_name varchar,
  area_description text,
  display_order integer,
  equipment_count bigint,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  option_id uuid;
BEGIN
  -- Get the primary quote option
  SELECT qo.id INTO option_id
  FROM quote_options qo
  WHERE qo.quote_id = p_quote_id
  AND qo.is_primary = true
  LIMIT 1;

  -- If no option exists, create a default one
  IF option_id IS NULL THEN
    INSERT INTO quote_options (quote_id, option_name, option_description, is_primary, display_order)
    VALUES (p_quote_id, 'Option 1', 'Default quote option', true, 1)
    RETURNING quote_options.id INTO option_id;
  END IF;

  -- Return areas for this option
  RETURN QUERY
  SELECT 
    qa.id,
    qa.quote_option_id,
    qa.area_name,
    qa.area_description,
    qa.display_order,
    COALESCE(COUNT(qe.id), 0)::bigint as equipment_count,
    qa.created_at,
    qa.updated_at
  FROM quote_areas qa
  LEFT JOIN quote_equipment qe ON qe.quote_area_id = qa.id
  WHERE qa.quote_option_id = option_id
  GROUP BY qa.id, qa.quote_option_id, qa.area_name, qa.area_description, qa.display_order, qa.created_at, qa.updated_at
  ORDER BY qa.display_order;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_quote_areas_rpc(uuid) TO authenticated;