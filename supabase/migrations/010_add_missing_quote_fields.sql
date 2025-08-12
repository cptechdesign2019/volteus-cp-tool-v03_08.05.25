-- Add any missing quote fields that might be referenced in the codebase
-- This prevents future schema cache issues

-- Add scope_of_work field (commonly used in quoting systems)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS scope_of_work TEXT;

-- Add internal_notes field (separate from customer-facing notes)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Add total_equipment_cost and total_labor_cost (for detailed breakdowns)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS total_equipment_cost NUMERIC DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS total_labor_cost NUMERIC DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS total_customer_price NUMERIC DEFAULT 0;

-- Ensure all pricing fields have proper defaults and constraints
UPDATE quotes SET total_price = 0 WHERE total_price IS NULL;
UPDATE quotes SET total_cost = 0 WHERE total_cost IS NULL;
UPDATE quotes SET gross_profit_margin = 0 WHERE gross_profit_margin IS NULL;

-- Add check constraints for pricing consistency
ALTER TABLE quotes ADD CONSTRAINT quotes_pricing_non_negative 
  CHECK (total_price >= 0 AND total_cost >= 0 AND gross_profit_margin >= 0);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
