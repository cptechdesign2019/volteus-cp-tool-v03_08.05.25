-- Migration: Create products table for AV equipment catalog
-- Created: 2025-07-31
-- Purpose: Support Product Library management with CSV import functionality

BEGIN;

-- Create the products table with all required fields from CSV structure
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id VARCHAR(50) UNIQUE NOT NULL,
  brand VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_number VARCHAR(100),
  description TEXT,
  dealer_price DECIMAL(10,2),
  msrp DECIMAL(10,2),
  map_price DECIMAL(10,2),
  primary_distributor VARCHAR(100),
  secondary_distributor VARCHAR(100),
  tertiary_distributor VARCHAR(100),
  spec_sheet_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add constraints for data integrity
ALTER TABLE products ADD CONSTRAINT chk_prices_positive 
  CHECK (
    (dealer_price IS NULL OR dealer_price >= 0) AND 
    (msrp IS NULL OR msrp >= 0) AND 
    (map_price IS NULL OR map_price >= 0)
  );

-- Removed restrictive product_id format constraint to allow flexible data import

-- Removed restrictive URL format constraints to allow flexible data import

-- Create indexes for search performance
-- Primary search index for product name and description (full-text search)
CREATE INDEX idx_products_search 
ON products USING GIN (
  to_tsvector('english', product_name || ' ' || COALESCE(description, ''))
);

-- Category filter index
CREATE INDEX idx_products_category ON products(category);

-- Brand filter index  
CREATE INDEX idx_products_brand ON products(brand);

-- Product number lookup index
CREATE INDEX idx_products_product_number ON products(product_number);

-- Composite index for common filter combinations
CREATE INDEX idx_products_brand_category ON products(brand, category);

-- Updated timestamp index for recent products
CREATE INDEX idx_products_updated_at ON products(updated_at DESC);

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read all products
CREATE POLICY "Users can read products" ON products
  FOR SELECT TO authenticated
  USING (true);

-- RLS Policy: Users can insert products (for imports)
CREATE POLICY "Users can insert products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- RLS Policy: Users can update products
CREATE POLICY "Users can update products" ON products
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = updated_by);

-- RLS Policy: Users can delete products
CREATE POLICY "Users can delete products" ON products
  FOR DELETE TO authenticated
  USING (true);

-- Create audit function to update the updated_at timestamp and updated_by user
CREATE OR REPLACE FUNCTION update_products_audit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update audit fields
CREATE TRIGGER products_audit_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_audit();

-- Add comments for documentation
COMMENT ON TABLE products IS 'AV equipment product catalog with pricing and distributor information';
COMMENT ON COLUMN products.product_id IS 'Unique product identifier from master price sheet (e.g., PROD10001)';
COMMENT ON COLUMN products.dealer_price IS 'Internal dealer cost price';
COMMENT ON COLUMN products.msrp IS 'Manufacturer suggested retail price';
COMMENT ON COLUMN products.map_price IS 'Minimum advertised price';
COMMENT ON COLUMN products.spec_sheet_url IS 'Link to product specification document';
COMMENT ON COLUMN products.image_url IS 'Link to product image';

COMMIT;