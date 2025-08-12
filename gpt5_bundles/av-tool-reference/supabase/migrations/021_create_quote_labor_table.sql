-- ===================================================================
-- Migration: Create Quote Labor Table
-- Description: Labor calculations with technician and subcontractor assignments
-- Version: 021
-- ===================================================================

-- Create custom types for labor
CREATE TYPE labor_type AS ENUM ('installation', 'programming', 'design_engineering', 'project_management', 'travel', 'troubleshooting', 'training', 'other');

-- Create quote_labor table
CREATE TABLE quote_labor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_option_id UUID REFERENCES quote_options(id) ON DELETE CASCADE,
  
  -- Labor type and description
  labor_type labor_type NOT NULL,
  labor_description VARCHAR(500) NOT NULL,
  
  -- Person assignment (either technician OR subcontractor)
  technician_id UUID REFERENCES technicians(id) ON DELETE RESTRICT,
  subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE RESTRICT,
  
  -- Time/rate calculation
  estimated_hours DECIMAL(8,2),
  estimated_days DECIMAL(6,2),
  hourly_rate DECIMAL(8,2),
  daily_rate DECIMAL(10,2),
  
  -- Customer pricing
  customer_hourly_rate DECIMAL(8,2) DEFAULT 100.00,
  customer_total DECIMAL(12,2),
  
  -- Cost calculation
  internal_cost DECIMAL(12,2),
  
  -- Organization
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT one_person_type CHECK (
    (technician_id IS NOT NULL AND subcontractor_id IS NULL) OR
    (technician_id IS NULL AND subcontractor_id IS NOT NULL)
  ),
  CONSTRAINT positive_labor_values CHECK (
    COALESCE(estimated_hours, 0) >= 0 AND 
    COALESCE(estimated_days, 0) >= 0 AND
    COALESCE(customer_total, 0) >= 0 AND
    COALESCE(internal_cost, 0) >= 0
  ),
  CONSTRAINT valid_time_estimates CHECK (
    (technician_id IS NOT NULL AND estimated_hours IS NOT NULL) OR
    (subcontractor_id IS NOT NULL AND estimated_days IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_quote_labor_option ON quote_labor(quote_option_id);
CREATE INDEX idx_quote_labor_technician ON quote_labor(technician_id) WHERE technician_id IS NOT NULL;
CREATE INDEX idx_quote_labor_subcontractor ON quote_labor(subcontractor_id) WHERE subcontractor_id IS NOT NULL;
CREATE INDEX idx_quote_labor_type ON quote_labor(labor_type);
CREATE INDEX idx_quote_labor_order ON quote_labor(quote_option_id, display_order);

-- Add updated_at trigger
CREATE TRIGGER quote_labor_updated_at
  BEFORE UPDATE ON quote_labor
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- Function to calculate labor costs and set defaults
CREATE OR REPLACE FUNCTION calculate_labor_costs()
RETURNS TRIGGER AS $$
DECLARE
  tech_data technicians%ROWTYPE;
  sub_data subcontractors%ROWTYPE;
BEGIN
  -- Set display order if not provided
  IF NEW.display_order IS NULL OR NEW.display_order = 0 THEN
    SELECT COALESCE(MAX(display_order), 0) + 1
    INTO NEW.display_order
    FROM quote_labor
    WHERE quote_option_id = NEW.quote_option_id;
  END IF;
  
  -- Handle technician labor
  IF NEW.technician_id IS NOT NULL THEN
    SELECT * INTO tech_data FROM technicians WHERE id = NEW.technician_id;
    
    -- Set hourly rate from technician if not provided
    NEW.hourly_rate := COALESCE(NEW.hourly_rate, tech_data.hourly_rate);
    
    -- Set default customer rate based on labor type
    IF NEW.customer_hourly_rate IS NULL THEN
      CASE NEW.labor_type
        WHEN 'programming', 'design_engineering' THEN
          NEW.customer_hourly_rate := 150.00;
        ELSE
          NEW.customer_hourly_rate := 100.00;
      END CASE;
    END IF;
    
    -- Calculate costs
    NEW.internal_cost := NEW.estimated_hours * NEW.hourly_rate;
    NEW.customer_total := NEW.estimated_hours * NEW.customer_hourly_rate;
    
    -- Clear subcontractor fields
    NEW.estimated_days := NULL;
    NEW.daily_rate := NULL;
  END IF;
  
  -- Handle subcontractor labor
  IF NEW.subcontractor_id IS NOT NULL THEN
    SELECT * INTO sub_data FROM subcontractors WHERE id = NEW.subcontractor_id;
    
    -- Set daily rate from subcontractor if not provided
    NEW.daily_rate := COALESCE(NEW.daily_rate, sub_data.daily_rate);
    NEW.hourly_rate := NEW.daily_rate / 8.0; -- Calculate hourly equivalent
    
    -- Set customer rate (mark up subcontractor cost)
    IF NEW.customer_hourly_rate IS NULL THEN
      NEW.customer_hourly_rate := NEW.hourly_rate * 1.5; -- 50% markup
    END IF;
    
    -- Calculate costs
    NEW.internal_cost := NEW.estimated_days * NEW.daily_rate;
    NEW.customer_total := NEW.estimated_days * 8 * NEW.customer_hourly_rate;
    
    -- Clear technician fields
    NEW.estimated_hours := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_labor_calculate_costs
  BEFORE INSERT OR UPDATE ON quote_labor
  FOR EACH ROW
  EXECUTE FUNCTION calculate_labor_costs();

-- Grant permissions
GRANT ALL ON quote_labor TO authenticated;
GRANT ALL ON quote_labor TO service_role;