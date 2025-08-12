-- ===================================================================
-- Migration: Create Subcontractors Table
-- Description: External contractors with day rates and contact information
-- Version: 020
-- ===================================================================

-- Create custom types for subcontractors
CREATE TYPE business_type AS ENUM ('individual', 'partnership', 'corporation', 'llc');
CREATE TYPE contractor_status AS ENUM ('active', 'inactive', 'terminated', 'suspended');

-- Create subcontractors table
CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company/individual information
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Business details
  business_type business_type DEFAULT 'individual',
  license_number VARCHAR(100),
  insurance_info JSONB,
  
  -- Rate information
  daily_rate DECIMAL(10,2) NOT NULL,
  hourly_rate DECIMAL(8,2) GENERATED ALWAYS AS (daily_rate / 8.0) STORED,
  specializations TEXT[],
  
  -- Status and availability
  contractor_status contractor_status DEFAULT 'active',
  is_available_for_quotes BOOLEAN DEFAULT true,
  
  -- Payment terms
  payment_terms VARCHAR(255) DEFAULT 'Net 30',
  tax_id VARCHAR(50),
  
  -- Contact and address information
  billing_address JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT positive_subcontractor_rate CHECK (daily_rate >= 0)
);

-- Create indexes
CREATE INDEX idx_subcontractors_status ON subcontractors(contractor_status);
CREATE INDEX idx_subcontractors_available ON subcontractors(is_available_for_quotes) WHERE is_available_for_quotes = true;
CREATE INDEX idx_subcontractors_specializations ON subcontractors USING GIN(specializations);
CREATE INDEX idx_subcontractors_company ON subcontractors(company_name);

-- Add updated_at trigger
CREATE TRIGGER subcontractors_updated_at
  BEFORE UPDATE ON subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- Grant permissions
GRANT ALL ON subcontractors TO authenticated;
GRANT ALL ON subcontractors TO service_role;