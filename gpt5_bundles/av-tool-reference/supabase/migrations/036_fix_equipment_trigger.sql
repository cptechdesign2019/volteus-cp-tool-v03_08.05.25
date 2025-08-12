-- ===================================================================
-- Migration: Fix Equipment Trigger for Correct Product Pricing Fields
-- Description: Update trigger to use dealer_price and msrp instead of cost_price and msrp_price
-- Version: 036
-- ===================================================================

-- Drop and recreate the equipment defaults function with correct field names
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
      
      -- Set costs if not overridden - using correct field names
      IF NOT NEW.cost_overridden THEN
        NEW.unit_cost := COALESCE(NEW.unit_cost, product_data.dealer_price);
      END IF;
      
      IF NOT NEW.price_overridden THEN
        NEW.unit_price := COALESCE(NEW.unit_price, product_data.msrp);
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