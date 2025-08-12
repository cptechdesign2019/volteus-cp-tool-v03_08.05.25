-- ===================================================================
-- Migration: Create Quote Equipment Table
-- Description: Equipment line items linked to areas and options
-- Version: 018
-- ===================================================================

-- Create quote_equipment table
CREATE TABLE quote_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_area_id UUID REFERENCES quote_areas(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  
  -- Item details (snapshot from products table, but editable)
  product_name VARCHAR(500) NOT NULL,
  product_number VARCHAR(100),
  brand VARCHAR(100),
  category VARCHAR(100),
  description TEXT,
  image_url VARCHAR(1000),
  
  -- Pricing (can be overridden from product library)
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  line_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Organization
  display_order INTEGER DEFAULT 0,
  
  -- Override tracking
  cost_overridden BOOLEAN DEFAULT false,
  price_overridden BOOLEAN DEFAULT false,
  details_overridden BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_equipment_values CHECK (
    quantity > 0 AND 
    unit_cost >= 0 AND 
    unit_price >= 0
  )
);

-- Create indexes
CREATE INDEX idx_quote_equipment_area ON quote_equipment(quote_area_id);
CREATE INDEX idx_quote_equipment_product ON quote_equipment(product_id);
CREATE INDEX idx_quote_equipment_order ON quote_equipment(quote_area_id, display_order);
CREATE INDEX idx_quote_equipment_brand ON quote_equipment(brand);
CREATE INDEX idx_quote_equipment_category ON quote_equipment(category);

-- Add updated_at trigger
CREATE TRIGGER quote_equipment_updated_at
  BEFORE UPDATE ON quote_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- Function to auto-set display order and populate from product library
CREATE OR REPLACE FUNCTION set_equipment_defaults()
RETURNS TRIGGER AS $$
DECLARE
  product_data products%ROWTYPE;
BEGIN
  -- Get product data if product_id is provided and details aren't overridden
  IF NEW.product_id IS NOT NULL AND NOT NEW.details_overridden THEN
    SELECT * INTO product_data FROM products WHERE id = NEW.product_id;
    
    IF FOUND THEN
      -- Only update if not already set (for inserts) or not overridden
      NEW.product_name := COALESCE(NEW.product_name, product_data.product_name);
      NEW.product_number := COALESCE(NEW.product_number, product_data.product_number);
      NEW.brand := COALESCE(NEW.brand, product_data.brand);
      NEW.category := COALESCE(NEW.category, product_data.category);
      NEW.description := COALESCE(NEW.description, product_data.description);
      NEW.image_url := COALESCE(NEW.image_url, product_data.image_url);
      
      -- Set costs if not overridden
      IF NOT NEW.cost_overridden THEN
        NEW.unit_cost := COALESCE(NEW.unit_cost, product_data.cost_price);
      END IF;
      
      IF NOT NEW.price_overridden THEN
        NEW.unit_price := COALESCE(NEW.unit_price, product_data.msrp_price);
      END IF;
    END IF;
  END IF;
  
  -- Set display order if not provided
  IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
    SELECT COALESCE(MAX(display_order), 0) + 1
    INTO NEW.display_order
    FROM quote_equipment
    WHERE quote_area_id = NEW.quote_area_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_equipment_set_defaults
  BEFORE INSERT OR UPDATE ON quote_equipment
  FOR EACH ROW
  EXECUTE FUNCTION set_equipment_defaults();

-- Grant permissions
GRANT ALL ON quote_equipment TO authenticated;
GRANT ALL ON quote_equipment TO service_role;