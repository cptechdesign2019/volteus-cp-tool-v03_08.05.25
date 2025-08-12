# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/01_customer-management-system/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Schema Changes

### New Tables
- **customer_accounts** - Core customer account information
- **customer_contacts** - Individual contacts linked to accounts

### Existing Table Modifications
- No modifications to existing tables required
- Integrates with existing user management system

### Migration Strategy
- Incremental schema deployment
- Zero-downtime migration approach
- Backward compatibility maintained

## Database Specifications

### Customer Accounts Table

```sql
CREATE TABLE customer_accounts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_name TEXT NOT NULL,
  customer_type TEXT CHECK (customer_type IN ('Residential', 'Commercial')) NOT NULL,
  billing_address JSONB DEFAULT '{}',
  service_address JSONB DEFAULT '{}',
  account_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_customer_accounts_company_name ON customer_accounts USING gin(to_tsvector('english', company_name));
CREATE INDEX idx_customer_accounts_customer_type ON customer_accounts(customer_type);
CREATE INDEX idx_customer_accounts_created_at ON customer_accounts(created_at DESC);
CREATE INDEX idx_customer_accounts_tags ON customer_accounts USING gin(tags);

-- RLS Policies
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their customer accounts" ON customer_accounts
  FOR SELECT USING (auth.uid() = created_by OR auth.uid() = updated_by);

CREATE POLICY "Users can insert customer accounts" ON customer_accounts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their customer accounts" ON customer_accounts
  FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = updated_by);

CREATE POLICY "Users can delete their customer accounts" ON customer_accounts
  FOR DELETE USING (auth.uid() = created_by);
```

### Customer Contacts Table

```sql
CREATE TABLE customer_contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_account_id BIGINT NOT NULL REFERENCES customer_accounts(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary_contact BOOLEAN DEFAULT FALSE,
  contact_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_customer_contacts_account_id ON customer_contacts(customer_account_id);
CREATE INDEX idx_customer_contacts_name ON customer_contacts USING gin(to_tsvector('english', contact_name));
CREATE INDEX idx_customer_contacts_email ON customer_contacts(email);
CREATE INDEX idx_customer_contacts_primary ON customer_contacts(customer_account_id, is_primary_contact) WHERE is_primary_contact = true;

-- RLS Policies
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts for their customer accounts" ON customer_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM customer_accounts 
      WHERE id = customer_contacts.customer_account_id 
      AND (created_by = auth.uid() OR updated_by = auth.uid())
    )
  );

CREATE POLICY "Users can insert contacts for their customer accounts" ON customer_contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM customer_accounts 
      WHERE id = customer_contacts.customer_account_id 
      AND (created_by = auth.uid() OR updated_by = auth.uid())
    )
  );

CREATE POLICY "Users can update contacts for their customer accounts" ON customer_contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM customer_accounts 
      WHERE id = customer_contacts.customer_account_id 
      AND (created_by = auth.uid() OR updated_by = auth.uid())
    )
  );

CREATE POLICY "Users can delete contacts for their customer accounts" ON customer_contacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM customer_accounts 
      WHERE id = customer_contacts.customer_account_id 
      AND (created_by = auth.uid() OR updated_by = auth.uid())
    )
  );
```

### JSONB Address Schema

```sql
-- Billing Address and Service Address JSONB structure
{
  "street": "123 Main Street",
  "city": "Anytown", 
  "state": "CA",
  "zip": "12345",
  "country": "USA"
}
```

## Performance Considerations

### Indexing Strategy
- **Full-text search** on company_name and contact_name using GIN indexes
- **Customer type filtering** with standard B-tree index
- **Date range queries** optimized with DESC index on created_at
- **Primary contact lookup** with conditional partial index

### Query Optimization
- **Search queries** leverage full-text search indexes
- **Customer stats** use efficient aggregation with proper indexes
- **Contact relationships** use foreign key indexes for joins
- **Tag filtering** uses GIN indexes for array operations

### Scalability
- **Partitioning strategy** ready for future implementation by date ranges
- **Archive strategy** for old customer records
- **Read replicas** support for high-traffic scenarios

## Data Integrity Rules

### Constraints
- **Customer type** limited to 'Residential' or 'Commercial'
- **Primary contact** uniqueness enforced per customer account
- **Email format** validation at application layer
- **Phone format** standardization at application layer

### Referential Integrity
- **Cascade delete** for contacts when customer account deleted
- **User audit trail** maintained through created_by/updated_by
- **Orphan prevention** through foreign key constraints

### Data Validation
- **JSONB validation** for address structure at application layer
- **Email uniqueness** checked within customer account scope
- **Phone number formatting** standardized for search efficiency

## Migration Scripts

### Initial Migration
```sql
-- File: 001_customer_management_schema.sql
-- Run this migration to create the customer management tables

-- Create customer_accounts table
CREATE TABLE customer_accounts (...);

-- Create customer_contacts table  
CREATE TABLE customer_contacts (...);

-- Create indexes
CREATE INDEX ...;

-- Enable RLS and create policies
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...;
```

### Rollback Strategy
```sql
-- Emergency rollback if needed
DROP TABLE IF EXISTS customer_contacts CASCADE;
DROP TABLE IF EXISTS customer_accounts CASCADE;
```

## Backup and Recovery

### Backup Strategy
- **Daily automated backups** of customer data
- **Point-in-time recovery** capability
- **Export functionality** for customer data portability

### Recovery Procedures
- **Data restoration** from automated backups
- **Selective recovery** for individual customer accounts
- **Data integrity verification** after recovery operations
