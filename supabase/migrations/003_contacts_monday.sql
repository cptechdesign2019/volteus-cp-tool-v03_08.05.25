-- Contacts (Monday.com) Sync Table
-- Created: 2025-01-08
-- Purpose: Store contact data pulled from Monday.com API for lead management

-- Create contacts_monday table to store data pulled from Monday.com
CREATE TABLE IF NOT EXISTS contacts_monday (
  monday_item_id BIGINT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  type TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_monday_name ON contacts_monday(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_monday_company ON contacts_monday(company);
CREATE INDEX IF NOT EXISTS idx_contacts_monday_email ON contacts_monday(email);
CREATE INDEX IF NOT EXISTS idx_contacts_monday_synced ON contacts_monday(last_synced_at);

-- Add RLS policies
ALTER TABLE contacts_monday ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all contacts
CREATE POLICY "Allow authenticated users to read contacts" 
ON contacts_monday FOR SELECT 
TO authenticated 
USING (true);

-- Allow service role to insert/update (for API sync)
CREATE POLICY "Allow service role to sync contacts" 
ON contacts_monday FOR ALL 
TO service_role 
USING (true);

-- Add audit trigger (if audit system exists)
-- This will be enabled when the audit system is in place
-- SELECT audit.audit_table('contacts_monday');
