-- Migration: Create customer_accounts table
-- Created: 2025-01-01
-- Purpose: Core customer account management with support for residential and commercial types

BEGIN;

-- Create customer_accounts table
CREATE TABLE customer_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('Residential', 'Commercial')),
  
  -- Address information stored as JSONB for flexibility
  billing_address JSONB,
  service_address JSONB,
  
  -- Additional account information
  account_notes TEXT,
  tags TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add comments for documentation
COMMENT ON TABLE customer_accounts IS 'Core customer account information for both residential and commercial customers';
COMMENT ON COLUMN customer_accounts.company_name IS 'Customer or company name - for residential customers, this would be the homeowner name';
COMMENT ON COLUMN customer_accounts.customer_type IS 'Type of customer: Residential or Commercial';
COMMENT ON COLUMN customer_accounts.billing_address IS 'JSON object containing billing address fields (street, city, state, zip, etc.)';
COMMENT ON COLUMN customer_accounts.service_address IS 'JSON object containing service address fields - may differ from billing address';
COMMENT ON COLUMN customer_accounts.account_notes IS 'General notes about the customer account';
COMMENT ON COLUMN customer_accounts.tags IS 'Array of tags for categorizing customers';

-- Create indexes for performance
CREATE INDEX idx_customer_accounts_company_name ON customer_accounts(company_name);
CREATE INDEX idx_customer_accounts_customer_type ON customer_accounts(customer_type);
CREATE INDEX idx_customer_accounts_created_at ON customer_accounts(created_at);
CREATE INDEX idx_customer_accounts_updated_at ON customer_accounts(updated_at);
CREATE INDEX idx_customer_accounts_created_by ON customer_accounts(created_by);

-- GIN index for full-text search on company name
CREATE INDEX idx_customer_accounts_company_name_gin ON customer_accounts USING GIN (to_tsvector('english', company_name));

-- GIN indexes for JSONB address fields
CREATE INDEX idx_customer_accounts_billing_address ON customer_accounts USING GIN (billing_address);
CREATE INDEX idx_customer_accounts_service_address ON customer_accounts USING GIN (service_address);

-- GIN index for tags array
CREATE INDEX idx_customer_accounts_tags ON customer_accounts USING GIN (tags);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at and updated_by
CREATE TRIGGER customer_accounts_updated_at_trigger
  BEFORE UPDATE ON customer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_accounts_updated_at();

-- Function to automatically set created_by on insert
CREATE OR REPLACE FUNCTION set_customer_accounts_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set created_by
CREATE TRIGGER customer_accounts_created_by_trigger
  BEFORE INSERT ON customer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION set_customer_accounts_created_by();

COMMIT;