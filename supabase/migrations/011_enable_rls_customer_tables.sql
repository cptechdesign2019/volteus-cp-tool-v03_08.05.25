-- Migration: Enable RLS and add policies for customer tables
-- Created: 2025-08-07
-- Purpose: Secure customer data by enabling Row Level Security and defining policies

BEGIN;

-- Enable RLS on customer_accounts
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;

-- Policies: customer_accounts
DROP POLICY IF EXISTS "Users can read customer accounts" ON customer_accounts;
CREATE POLICY "Users can read customer accounts" ON customer_accounts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert customer accounts" ON customer_accounts;
CREATE POLICY "Users can insert customer accounts" ON customer_accounts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update customer accounts" ON customer_accounts;
CREATE POLICY "Users can update customer accounts" ON customer_accounts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = updated_by);

DROP POLICY IF EXISTS "Users can delete customer accounts" ON customer_accounts;
CREATE POLICY "Users can delete customer accounts" ON customer_accounts
  FOR DELETE TO authenticated
  USING (true);

-- Enable RLS on customer_contacts
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

-- Policies: customer_contacts
DROP POLICY IF EXISTS "Users can read customer contacts" ON customer_contacts;
CREATE POLICY "Users can read customer contacts" ON customer_contacts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert customer contacts" ON customer_contacts;
CREATE POLICY "Users can insert customer contacts" ON customer_contacts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update customer contacts" ON customer_contacts;
CREATE POLICY "Users can update customer contacts" ON customer_contacts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = updated_by);

DROP POLICY IF EXISTS "Users can delete customer contacts" ON customer_contacts;
CREATE POLICY "Users can delete customer contacts" ON customer_contacts
  FOR DELETE TO authenticated
  USING (true);

COMMIT;

