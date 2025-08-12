-- Migration: Row Level Security policies for customer data
-- Created: 2025-01-01
-- Purpose: Secure customer data access with proper RLS policies

BEGIN;

-- Enable RLS on customer_accounts table
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on customer_contacts table
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_accounts table

-- Policy: Users can view all customer accounts (authenticated users only)
CREATE POLICY "Users can view customer accounts" ON customer_accounts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert customer accounts
CREATE POLICY "Users can insert customer accounts" ON customer_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update customer accounts
CREATE POLICY "Users can update customer accounts" ON customer_accounts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can delete customer accounts
CREATE POLICY "Users can delete customer accounts" ON customer_accounts
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for customer_contacts table

-- Policy: Users can view customer contacts (authenticated users only)
CREATE POLICY "Users can view customer contacts" ON customer_contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert customer contacts
CREATE POLICY "Users can insert customer contacts" ON customer_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update customer contacts
CREATE POLICY "Users can update customer contacts" ON customer_contacts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can delete customer contacts
CREATE POLICY "Users can delete customer contacts" ON customer_contacts
  FOR DELETE
  TO authenticated
  USING (true);

-- Grant necessary permissions to authenticated users

-- Grant permissions on customer_accounts
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_accounts TO authenticated;

-- Grant permissions on customer_contacts  
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_contacts TO authenticated;

-- Grant permissions for the trigger functions
GRANT EXECUTE ON FUNCTION update_customer_accounts_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION set_customer_accounts_created_by() TO authenticated;
GRANT EXECUTE ON FUNCTION update_customer_contacts_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION set_customer_contacts_created_by() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_single_primary_contact() TO authenticated;

COMMIT;