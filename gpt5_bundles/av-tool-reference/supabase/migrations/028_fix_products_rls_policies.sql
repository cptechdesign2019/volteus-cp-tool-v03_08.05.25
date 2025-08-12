-- ===================================================================
-- Migration: Fix Products RLS Policies
-- Description: Allow broader access to products for frontend functionality
-- Version: 028
-- ===================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;

-- Create more permissive policies for product library functionality

-- Allow all authenticated users to read products (no additional restrictions)
CREATE POLICY "Allow authenticated users to read products" ON products
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to insert products (for CSV imports)
CREATE POLICY "Allow authenticated users to insert products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update products
CREATE POLICY "Allow authenticated users to update products" ON products
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete products
CREATE POLICY "Allow authenticated users to delete products" ON products
  FOR DELETE TO authenticated
  USING (true);

-- Also allow anonymous access for product reading (public catalog)
CREATE POLICY "Allow anonymous users to read products" ON products
  FOR SELECT TO anon
  USING (true);