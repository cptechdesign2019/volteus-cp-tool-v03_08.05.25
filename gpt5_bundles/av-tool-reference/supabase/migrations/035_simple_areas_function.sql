-- ===================================================================
-- Migration: Simple Areas Function
-- Description: Create a simple RPC function for quote areas
-- Version: 035
-- ===================================================================

-- Drop any existing functions
DROP FUNCTION IF EXISTS get_quote_areas_rpc(uuid);
DROP FUNCTION IF EXISTS get_quote_with_options(uuid);

-- Create a simple function to get quote areas
CREATE OR REPLACE FUNCTION get_quote_areas_simple(quote_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  option_id uuid;
BEGIN
  -- Get or create the primary quote option
  SELECT qo.id INTO option_id
  FROM quote_options qo
  WHERE qo.quote_id = quote_id_param
  AND qo.is_primary = true
  LIMIT 1;

  -- If no option exists, create a default one
  IF option_id IS NULL THEN
    INSERT INTO quote_options (quote_id, option_name, option_description, is_primary, display_order)
    VALUES (quote_id_param, 'Option 1', 'Default quote option', true, 1)
    RETURNING quote_options.id INTO option_id;
  END IF;

  -- Return areas as JSON
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', qa.id,
      'quote_option_id', qa.quote_option_id,
      'area_name', qa.area_name,
      'area_description', qa.area_description,
      'display_order', qa.display_order,
      'equipment_count', COALESCE(equipment_counts.count, 0),
      'created_at', qa.created_at,
      'updated_at', qa.updated_at
    )
  ), '[]'::json) INTO result
  FROM quote_areas qa
  LEFT JOIN (
    SELECT quote_area_id, COUNT(*) as count
    FROM quote_equipment
    GROUP BY quote_area_id
  ) equipment_counts ON equipment_counts.quote_area_id = qa.id
  WHERE qa.quote_option_id = option_id
  ORDER BY qa.display_order;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_quote_areas_simple(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_quote_areas_simple(uuid) TO anon;