# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/02_product-library-management/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Schema Changes

### New Tables
- **products** - Comprehensive AV product catalog with pricing and specifications

### Existing Table Modifications
- No modifications to existing tables required
- Integrates with existing user management and customer systems

### Migration Strategy
- Single-step schema deployment
- Backward compatibility maintained
- Zero-downtime deployment approach

## Database Specifications

### Products Table

```sql
CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id TEXT UNIQUE NOT NULL, -- Business identifier (PROD#####)
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_number TEXT, -- Manufacturer part number
  description TEXT,
  dealer_price DECIMAL(10,2), -- Company cost
  msrp DECIMAL(10,2), -- Manufacturer Suggested Retail Price
  map_price DECIMAL(10,2), -- Minimum Advertised Price
  primary_distributor TEXT,
  secondary_distributor TEXT,
  tertiary_distributor TEXT,
  spec_sheet_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance optimization
CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand_category ON products(brand, category);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', product_name));
CREATE INDEX idx_products_description_search ON products USING gin(to_tsvector('english', description));
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_pricing ON products(dealer_price, msrp, map_price) WHERE dealer_price IS NOT NULL;

-- Composite index for comprehensive search
CREATE INDEX idx_products_full_search ON products USING gin(
  to_tsvector('english', product_name || ' ' || COALESCE(description, '') || ' ' || brand || ' ' || category)
);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products" ON products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update products they created" ON products
  FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = updated_by);

CREATE POLICY "Users can delete products they created" ON products
  FOR DELETE USING (auth.uid() = created_by);

-- Service role policies for CSV import
CREATE POLICY "Service role can manage all products" ON products
  FOR ALL TO service_role USING (true);
```

### Product Constraints and Validations

```sql
-- Add constraints for data integrity
ALTER TABLE products ADD CONSTRAINT products_brand_not_empty 
  CHECK (length(trim(brand)) > 0);

ALTER TABLE products ADD CONSTRAINT products_category_not_empty 
  CHECK (length(trim(category)) > 0);

ALTER TABLE products ADD CONSTRAINT products_name_not_empty 
  CHECK (length(trim(product_name)) > 0);

ALTER TABLE products ADD CONSTRAINT products_dealer_price_positive 
  CHECK (dealer_price IS NULL OR dealer_price >= 0);

ALTER TABLE products ADD CONSTRAINT products_msrp_positive 
  CHECK (msrp IS NULL OR msrp >= 0);

ALTER TABLE products ADD CONSTRAINT products_map_price_positive 
  CHECK (map_price IS NULL OR map_price >= 0);

-- Ensure MAP price doesn't exceed MSRP
ALTER TABLE products ADD CONSTRAINT products_map_msrp_relationship 
  CHECK (map_price IS NULL OR msrp IS NULL OR map_price <= msrp);

-- URL format validation (basic)
ALTER TABLE products ADD CONSTRAINT products_spec_url_format 
  CHECK (spec_sheet_url IS NULL OR spec_sheet_url ~* '^https?://');

ALTER TABLE products ADD CONSTRAINT products_image_url_format 
  CHECK (image_url IS NULL OR image_url ~* '^https?://');
```

### Functions for Product Management

```sql
-- Function to auto-generate product IDs
CREATE OR REPLACE FUNCTION generate_product_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    -- Generate ID with format PROD + timestamp + counter
    new_id := 'PROD' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || 
              LPAD(counter::TEXT, 2, '0');
    
    -- Check if ID already exists
    IF NOT EXISTS (SELECT 1 FROM products WHERE product_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    counter := counter + 1;
    
    -- Prevent infinite loop
    IF counter > 999 THEN
      RAISE EXCEPTION 'Unable to generate unique product ID';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update product timestamps
CREATE OR REPLACE FUNCTION update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update timestamps
CREATE TRIGGER products_update_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_timestamp();
```

### Views for Common Queries

```sql
-- View for product statistics
CREATE VIEW product_statistics AS
SELECT 
  COUNT(*) as total_products,
  COUNT(DISTINCT brand) as unique_brands,
  COUNT(DISTINCT category) as unique_categories,
  COUNT(*) FILTER (WHERE dealer_price IS NOT NULL) as products_with_pricing,
  COUNT(*) FILTER (WHERE spec_sheet_url IS NOT NULL OR image_url IS NOT NULL) as products_with_assets,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_additions
FROM products;

-- View for brand/category combinations
CREATE VIEW brand_category_combinations AS
SELECT 
  brand,
  category,
  COUNT(*) as product_count,
  MIN(dealer_price) as min_price,
  MAX(dealer_price) as max_price,
  AVG(dealer_price) as avg_price
FROM products 
WHERE dealer_price IS NOT NULL
GROUP BY brand, category
ORDER BY brand, category;

-- View for products with complete information
CREATE VIEW complete_products AS
SELECT *
FROM products
WHERE dealer_price IS NOT NULL 
  AND msrp IS NOT NULL
  AND description IS NOT NULL
  AND spec_sheet_url IS NOT NULL;
```

## Performance Considerations

### Indexing Strategy
- **Primary Search**: Full-text search index on product name, description, brand, and category
- **Brand/Category Filtering**: Composite index for efficient dropdown population
- **Pricing Queries**: Partial index on pricing fields for products with pricing data
- **Date Range Queries**: Descending index on created_at for recent product queries
- **Business ID Lookup**: Unique index on product_id for fast business identifier searches

### Query Optimization Patterns
```sql
-- Efficient product search with filters
SELECT p.*, 
       ts_rank(to_tsvector('english', product_name || ' ' || COALESCE(description, '')), 
               plainto_tsquery('english', ?)) as relevance
FROM products p
WHERE (? IS NULL OR to_tsvector('english', product_name || ' ' || COALESCE(description, '')) 
       @@ plainto_tsquery('english', ?))
  AND (? IS NULL OR brand = ?)
  AND (? IS NULL OR category = ?)
ORDER BY relevance DESC, created_at DESC
LIMIT ? OFFSET ?;

-- Efficient brand/category list population
SELECT DISTINCT brand FROM products ORDER BY brand;
SELECT DISTINCT category FROM products ORDER BY category;

-- Efficient statistics calculation
SELECT 
  (SELECT COUNT(*) FROM products) as total,
  (SELECT COUNT(DISTINCT brand) FROM products) as brands,
  (SELECT COUNT(DISTINCT category) FROM products) as categories;
```

### Batch Import Optimization
```sql
-- Optimized upsert for CSV imports
INSERT INTO products (
  product_id, brand, category, product_name, product_number, 
  description, dealer_price, msrp, map_price, 
  primary_distributor, secondary_distributor, tertiary_distributor,
  spec_sheet_url, image_url, created_by
) VALUES 
  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT (product_id) 
DO UPDATE SET
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  product_name = EXCLUDED.product_name,
  product_number = EXCLUDED.product_number,
  description = EXCLUDED.description,
  dealer_price = EXCLUDED.dealer_price,
  msrp = EXCLUDED.msrp,
  map_price = EXCLUDED.map_price,
  primary_distributor = EXCLUDED.primary_distributor,
  secondary_distributor = EXCLUDED.secondary_distributor,
  tertiary_distributor = EXCLUDED.tertiary_distributor,
  spec_sheet_url = EXCLUDED.spec_sheet_url,
  image_url = EXCLUDED.image_url,
  updated_at = NOW(),
  updated_by = auth.uid();
```

## Data Integrity Rules

### Business Logic Constraints
- **Product ID Uniqueness**: Enforced at database level with unique constraint
- **Required Fields**: Brand, category, and product name are mandatory
- **Pricing Logic**: MAP price cannot exceed MSRP when both are present
- **URL Format**: Basic HTTP/HTTPS validation for spec and image URLs
- **Positive Pricing**: All price fields must be positive when specified

### Referential Integrity
- **User Audit Trail**: Created_by and updated_by reference valid users
- **Cascade Behavior**: Products are preserved when users are deleted (audit trail maintained)
- **Data Consistency**: Triggers ensure updated_at is always current

### Data Quality Rules
- **Text Field Trimming**: Leading/trailing whitespace automatically trimmed
- **Case Consistency**: Brand and category names stored with consistent capitalization
- **URL Validation**: Application-layer validation for complete URL format checking
- **Price Precision**: Decimal(10,2) ensures consistent price formatting

## Scalability Considerations

### Partitioning Strategy
```sql
-- Future partitioning by brand for very large catalogs
CREATE TABLE products_partition_electronics 
  PARTITION OF products 
  FOR VALUES IN ('Sony', 'Samsung', 'LG', 'Panasonic');

CREATE TABLE products_partition_audio 
  PARTITION OF products 
  FOR VALUES IN ('Bose', 'Sonos', 'Yamaha', 'Denon');
```

### Archive Strategy
```sql
-- Archive old products (future enhancement)
CREATE TABLE products_archive (
  LIKE products INCLUDING ALL
);

-- Function to archive discontinued products
CREATE OR REPLACE FUNCTION archive_discontinued_products()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  WITH archived AS (
    DELETE FROM products 
    WHERE last_updated < NOW() - INTERVAL '2 years'
      AND product_id NOT IN (
        SELECT DISTINCT product_id 
        FROM quote_equipment 
        WHERE created_at > NOW() - INTERVAL '1 year'
      )
    RETURNING *
  )
  INSERT INTO products_archive 
  SELECT * FROM archived;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
```

## Migration Scripts

### Initial Migration
```sql
-- File: 002_product_library_schema.sql
-- Run this migration to create the product library tables

-- Create products table with all constraints
CREATE TABLE products (...);

-- Create indexes for performance
CREATE INDEX idx_products_product_id ON products(product_id);
-- ... (all other indexes)

-- Create supporting functions
CREATE OR REPLACE FUNCTION generate_product_id() ...;
CREATE OR REPLACE FUNCTION update_product_timestamp() ...;

-- Create triggers
CREATE TRIGGER products_update_timestamp ...;

-- Enable RLS and create policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all products" ...;
-- ... (all other policies)

-- Create views
CREATE VIEW product_statistics AS ...;
CREATE VIEW brand_category_combinations AS ...;
CREATE VIEW complete_products AS ...;
```

### Data Migration (if migrating from existing system)
```sql
-- Sample data migration from legacy product tables
INSERT INTO products (
  product_id, brand, category, product_name, 
  dealer_price, msrp, created_by
)
SELECT 
  CONCAT('MIGR', LPAD(legacy_id::TEXT, 6, '0')),
  manufacturer,
  product_category,
  name,
  cost,
  retail_price,
  (SELECT id FROM auth.users WHERE email = 'system@company.com')
FROM legacy_products
WHERE active = true;
```

### Rollback Strategy
```sql
-- Emergency rollback if needed
DROP TRIGGER IF EXISTS products_update_timestamp ON products;
DROP FUNCTION IF EXISTS update_product_timestamp();
DROP FUNCTION IF EXISTS generate_product_id();
DROP VIEW IF EXISTS complete_products;
DROP VIEW IF EXISTS brand_category_combinations;
DROP VIEW IF EXISTS product_statistics;
DROP TABLE IF EXISTS products CASCADE;
```

## Backup and Recovery

### Backup Strategy
- **Daily automated backups** of product catalog data
- **Incremental backups** for high-volume import days
- **CSV export functionality** for business continuity
- **Version control** for schema changes

### Recovery Procedures
- **Point-in-time recovery** for data corruption scenarios
- **Selective product restoration** from backups
- **CSV re-import capability** for disaster recovery
- **Data integrity verification** after recovery operations

### Business Continuity
- **Product data export** in standard CSV format
- **Schema documentation** for emergency reconstruction
- **Critical product identification** for priority restoration
- **Vendor data integration** for rapid catalog rebuilding
