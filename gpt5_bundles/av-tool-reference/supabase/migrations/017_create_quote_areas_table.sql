-- ===================================================================
-- Migration: Create Quote Areas Table  
-- Description: Room/space definitions for equipment organization
-- Version: 017
-- ===================================================================

-- Create quote_areas table
CREATE TABLE quote_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_option_id UUID REFERENCES quote_options(id) ON DELETE CASCADE,
  area_name VARCHAR(255) NOT NULL,
  area_description TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Area-specific settings
  area_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(quote_option_id, area_name)
);

-- Create indexes
CREATE INDEX idx_quote_areas_option ON quote_areas(quote_option_id);
CREATE INDEX idx_quote_areas_order ON quote_areas(quote_option_id, display_order);

-- Add updated_at trigger
CREATE TRIGGER quote_areas_updated_at
  BEFORE UPDATE ON quote_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- Function to auto-set display order
CREATE OR REPLACE FUNCTION set_area_display_order()
RETURNS TRIGGER AS $$
BEGIN
  -- If display_order is not set, make it the next in sequence
  IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
    SELECT COALESCE(MAX(display_order), 0) + 1
    INTO NEW.display_order
    FROM quote_areas
    WHERE quote_option_id = NEW.quote_option_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_areas_set_order
  BEFORE INSERT ON quote_areas
  FOR EACH ROW
  EXECUTE FUNCTION set_area_display_order();

-- Grant permissions
GRANT ALL ON quote_areas TO authenticated;
GRANT ALL ON quote_areas TO service_role;