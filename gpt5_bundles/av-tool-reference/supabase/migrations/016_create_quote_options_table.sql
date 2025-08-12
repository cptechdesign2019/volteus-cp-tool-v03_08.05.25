-- ===================================================================
-- Migration: Create Quote Options Table
-- Description: Quote variations and alternatives system
-- Version: 016
-- ===================================================================

-- Create quote_options table
CREATE TABLE quote_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  option_name VARCHAR(255) NOT NULL,
  option_description TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Financial totals for this option (calculated and cached)
  equipment_subtotal DECIMAL(12,2) DEFAULT 0,
  labor_subtotal DECIMAL(12,2) DEFAULT 0,
  equipment_cost DECIMAL(12,2) DEFAULT 0,
  labor_cost DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_option_amounts CHECK (
    equipment_subtotal >= 0 AND 
    labor_subtotal >= 0 AND
    equipment_cost >= 0 AND
    labor_cost >= 0
  ),
  
  -- Ensure unique option names per quote
  UNIQUE(quote_id, option_name)
);

-- Create indexes
CREATE INDEX idx_quote_options_quote ON quote_options(quote_id);
CREATE INDEX idx_quote_options_primary ON quote_options(quote_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_quote_options_order ON quote_options(quote_id, display_order);

-- Add updated_at trigger
CREATE TRIGGER quote_options_updated_at
  BEFORE UPDATE ON quote_options
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- Function to ensure only one primary option per quote
CREATE OR REPLACE FUNCTION ensure_single_primary_option()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this option as primary, unset all other primary options for this quote
  IF NEW.is_primary = true THEN
    UPDATE quote_options 
    SET is_primary = false 
    WHERE quote_id = NEW.quote_id AND id != NEW.id AND is_primary = true;
  END IF;
  
  -- If this is the first option for a quote, make it primary
  IF NOT EXISTS (
    SELECT 1 FROM quote_options 
    WHERE quote_id = NEW.quote_id AND is_primary = true AND id != NEW.id
  ) THEN
    NEW.is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_options_ensure_primary
  BEFORE INSERT OR UPDATE ON quote_options
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_option();

-- Grant permissions
GRANT ALL ON quote_options TO authenticated;
GRANT ALL ON quote_options TO service_role;