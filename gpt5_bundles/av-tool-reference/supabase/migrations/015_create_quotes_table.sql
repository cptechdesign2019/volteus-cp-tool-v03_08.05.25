-- ===================================================================
-- Migration: Create Quotes Table
-- Description: Main quotes table with status workflow and financial tracking
-- Version: 015
-- ===================================================================

-- Create custom types for quotes
CREATE TYPE quotes_status AS ENUM ('draft', 'sent', 'pending_changes', 'accepted', 'expired', 'archived');
CREATE TYPE expiration_type AS ENUM ('never', '30_days', '60_days', '90_days');

-- Create quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number VARCHAR(20) UNIQUE NOT NULL,
  customer_account_id UUID REFERENCES customer_accounts(id) ON DELETE RESTRICT,
  sales_rep_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  status quotes_status DEFAULT 'draft',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Expiration handling
  expires_at TIMESTAMP WITH TIME ZONE,
  expiration_type expiration_type DEFAULT 'never',
  
  -- Financial totals (calculated and cached)
  equipment_subtotal DECIMAL(12,2) DEFAULT 0,
  labor_subtotal DECIMAL(12,2) DEFAULT 0,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  shipping_percentage DECIMAL(5,2) DEFAULT 5.00,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  tax_percentage DECIMAL(5,2) DEFAULT 8.00,
  tax_exempt BOOLEAN DEFAULT false,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Cost tracking
  equipment_cost DECIMAL(12,2) DEFAULT 0,
  labor_cost DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  gross_profit DECIMAL(12,2) DEFAULT 0,
  gross_profit_margin DECIMAL(5,2) DEFAULT 0,
  
  -- Commission tracking
  commission_amount DECIMAL(12,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  
  -- Customer interaction
  customer_viewed_at TIMESTAMP WITH TIME ZONE,
  customer_view_count INTEGER DEFAULT 0,
  customer_access_token VARCHAR(255) UNIQUE,
  
  -- Quote acceptance
  accepted_at TIMESTAMP WITH TIME ZONE,
  signature_data JSONB,
  acceptance_ip_address INET,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT positive_amounts CHECK (
    equipment_subtotal >= 0 AND 
    labor_subtotal >= 0 AND 
    total_amount >= 0 AND
    gross_profit_margin >= 0 AND
    shipping_percentage >= 0 AND
    tax_percentage >= 0 AND
    commission_rate >= 0
  ),
  
  CONSTRAINT valid_expiration CHECK (
    (expiration_type = 'never' AND expires_at IS NULL) OR
    (expiration_type != 'never' AND expires_at IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX idx_quotes_customer ON quotes(customer_account_id);
CREATE INDEX idx_quotes_sales_rep ON quotes(sales_rep_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_number ON quotes(quote_number);
CREATE INDEX idx_quotes_created ON quotes(created_at DESC);
CREATE INDEX idx_quotes_updated ON quotes(updated_at DESC);
CREATE INDEX idx_quotes_expires ON quotes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_quotes_status_sales_rep ON quotes(status, sales_rep_id, created_at DESC);
CREATE INDEX idx_quotes_customer_status ON quotes(customer_account_id, status, updated_at DESC);

-- Create search index for quote numbers and titles
CREATE INDEX idx_quotes_search ON quotes USING GIN (
  to_tsvector('english', quote_number || ' ' || title || ' ' || COALESCE(description, ''))
);

-- Create financial performance index
CREATE INDEX idx_quotes_financial ON quotes(total_amount DESC, gross_profit_margin DESC) 
WHERE status IN ('sent', 'accepted');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- Grant permissions
GRANT ALL ON quotes TO authenticated;
GRANT ALL ON quotes TO service_role;