-- ===================================================================
-- Migration: Fix generate_quote_number Permissions
-- Description: Add SECURITY DEFINER to allow access to quotes table with RLS
-- Version: 029
-- ===================================================================

-- Recreate the generate_quote_number function with SECURITY DEFINER
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure proper permissions are maintained
GRANT EXECUTE ON FUNCTION generate_quote_number TO authenticated;
GRANT EXECUTE ON FUNCTION generate_quote_number TO service_role;