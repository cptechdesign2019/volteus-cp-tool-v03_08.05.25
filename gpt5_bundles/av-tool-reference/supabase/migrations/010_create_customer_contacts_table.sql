-- Migration: Create customer_contacts table
-- Created: 2025-01-01
-- Purpose: Individual contact records linked to customer accounts (one-to-many relationship)

BEGIN;

-- Create customer_contacts table
CREATE TABLE customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_account_id UUID NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
  
  -- Contact information
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(100),
  is_primary_contact BOOLEAN DEFAULT FALSE,
  
  -- Additional contact information
  contact_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add comments for documentation
COMMENT ON TABLE customer_contacts IS 'Individual contact records associated with customer accounts';
COMMENT ON COLUMN customer_contacts.customer_account_id IS 'Foreign key reference to customer_accounts table';
COMMENT ON COLUMN customer_contacts.contact_name IS 'Full name of the contact person';
COMMENT ON COLUMN customer_contacts.email IS 'Email address of the contact';
COMMENT ON COLUMN customer_contacts.phone IS 'Phone number of the contact (formatted as string for flexibility)';
COMMENT ON COLUMN customer_contacts.role IS 'Role or title of the contact (e.g., Owner, Manager, Facilities Director)';
COMMENT ON COLUMN customer_contacts.is_primary_contact IS 'Indicates if this is the primary contact for the customer account';
COMMENT ON COLUMN customer_contacts.contact_notes IS 'Additional notes about this specific contact';

-- Create indexes for performance
CREATE INDEX idx_customer_contacts_customer_account_id ON customer_contacts(customer_account_id);
CREATE INDEX idx_customer_contacts_contact_name ON customer_contacts(contact_name);
CREATE INDEX idx_customer_contacts_email ON customer_contacts(email);
CREATE INDEX idx_customer_contacts_phone ON customer_contacts(phone);
CREATE INDEX idx_customer_contacts_is_primary_contact ON customer_contacts(is_primary_contact);
CREATE INDEX idx_customer_contacts_created_at ON customer_contacts(created_at);
CREATE INDEX idx_customer_contacts_updated_at ON customer_contacts(updated_at);

-- GIN index for full-text search on contact name
CREATE INDEX idx_customer_contacts_contact_name_gin ON customer_contacts USING GIN (to_tsvector('english', contact_name));

-- Composite index for finding primary contacts for specific accounts
CREATE INDEX idx_customer_contacts_account_primary ON customer_contacts(customer_account_id, is_primary_contact);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at and updated_by
CREATE TRIGGER customer_contacts_updated_at_trigger
  BEFORE UPDATE ON customer_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_contacts_updated_at();

-- Function to automatically set created_by on insert
CREATE OR REPLACE FUNCTION set_customer_contacts_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set created_by
CREATE TRIGGER customer_contacts_created_by_trigger
  BEFORE INSERT ON customer_contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_customer_contacts_created_by();

-- Function to ensure only one primary contact per customer account
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this contact as primary, unset all other primary contacts for this account
  IF NEW.is_primary_contact = TRUE THEN
    UPDATE customer_contacts 
    SET is_primary_contact = FALSE 
    WHERE customer_account_id = NEW.customer_account_id 
      AND id != NEW.id 
      AND is_primary_contact = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one primary contact per account
CREATE TRIGGER ensure_single_primary_contact_trigger
  BEFORE INSERT OR UPDATE ON customer_contacts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_contact();

COMMIT;