# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/03_monday-leads-integration/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Schema Changes

### New Tables
- **contacts_monday** - Synchronized contact data from Monday.com

### Existing Table Modifications
- No modifications to existing tables required

### Migration Strategy
- Single migration deployment
- Zero-downtime implementation
- Backward compatibility maintained

## Database Specifications

### Monday.com Contacts Table

```sql
CREATE TABLE contacts_monday (
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

-- Indexes for performance
CREATE INDEX idx_contacts_monday_name ON contacts_monday 
  USING gin(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')));
CREATE INDEX idx_contacts_monday_company ON contacts_monday(company);
CREATE INDEX idx_contacts_monday_email ON contacts_monday(email);
CREATE INDEX idx_contacts_monday_type ON contacts_monday(type);
CREATE INDEX idx_contacts_monday_synced ON contacts_monday(last_synced_at DESC);

-- RLS Policies
ALTER TABLE contacts_monday ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view Monday contacts" ON contacts_monday
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage all Monday contacts" ON contacts_monday
  FOR ALL TO service_role USING (true);
```

## Performance Considerations

### Indexing Strategy
- **Full-text search** on combined first/last names
- **Company filtering** with B-tree index
- **Email lookup** for contact identification
- **Type filtering** for contact categorization
- **Sync timestamp** for recent contact queries

### Query Optimization
```sql
-- Efficient contact search
SELECT * FROM contacts_monday 
WHERE to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) 
      @@ plainto_tsquery('english', ?)
ORDER BY last_synced_at DESC;

-- Efficient company filtering
SELECT * FROM contacts_monday 
WHERE company ILIKE '%?%'
ORDER BY first_name, last_name;
```

## Migration Scripts

### Initial Migration
```sql
-- File: 003_contacts_monday.sql
CREATE TABLE contacts_monday (...);
CREATE INDEX ...;
ALTER TABLE contacts_monday ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...;
```

### Rollback Strategy
```sql
DROP TABLE IF EXISTS contacts_monday CASCADE;
```
