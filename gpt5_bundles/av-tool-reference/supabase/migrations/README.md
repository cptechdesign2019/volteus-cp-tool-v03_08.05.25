# Products Table Migration Guide

This guide explains how to apply the products table migration to your Supabase database.

## Migration File: `006_create_products_table.sql`

This migration creates the complete products table schema for the AV Management Tool Product Library feature.

### What This Migration Creates:

1. **Products Table** - Complete schema with all 14 CSV columns
2. **Indexes** - Optimized for search and filtering performance
3. **RLS Policies** - Secure access control for authenticated users
4. **Audit Triggers** - Automatic timestamp and user tracking
5. **Data Constraints** - Validation for data integrity

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `006_create_products_table.sql`
4. Paste into a new SQL query
5. Click **Run** to execute the migration

### Option 2: Supabase CLI (if available)

```bash
supabase db push
```

### Option 3: Manual Verification Script

```bash
# Install dependencies if needed
npm install

# Run the verification script
node scripts/run-migration.js
```

## Verification Steps

After running the migration, verify it worked correctly:

### 1. Check Table Exists
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'products';
```

### 2. Test Insert Operation
```sql
INSERT INTO products (
  product_id, brand, category, product_name, dealer_price, msrp, map_price
) VALUES (
  'TEST_001', 'Test Brand', 'Test Category', 'Test Product', 99.99, 199.99, 149.99
);
```

### 3. Verify Indexes
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'products';
```

### 4. Test RLS Policies
```sql
-- This should work for authenticated users
SELECT * FROM products LIMIT 1;
```

### 5. Test Full-Text Search
```sql
SELECT * FROM products 
WHERE to_tsvector('english', product_name || ' ' || COALESCE(description, '')) 
@@ to_tsquery('english', 'test');
```

## Expected Schema

The migration creates a table with these columns:

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, AUTO-GENERATED |
| product_id | VARCHAR(50) | UNIQUE, NOT NULL |
| brand | VARCHAR(100) | NOT NULL |
| category | VARCHAR(100) | NOT NULL |
| product_name | VARCHAR(255) | NOT NULL |
| product_number | VARCHAR(100) | NULLABLE |
| description | TEXT | NULLABLE |
| dealer_price | DECIMAL(10,2) | NULLABLE, >= 0 |
| msrp | DECIMAL(10,2) | NULLABLE, >= 0 |
| map_price | DECIMAL(10,2) | NULLABLE, >= 0 |
| primary_distributor | VARCHAR(100) | NULLABLE |
| secondary_distributor | VARCHAR(100) | NULLABLE |
| tertiary_distributor | VARCHAR(100) | NULLABLE |
| spec_sheet_url | TEXT | NULLABLE, URL FORMAT |
| image_url | TEXT | NULLABLE, URL FORMAT |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() |
| created_by | UUID | FOREIGN KEY TO auth.users |
| updated_by | UUID | FOREIGN KEY TO auth.users |

## Performance Optimizations

The migration includes these indexes for optimal performance:

- **Full-text search** on product_name and description
- **Brand filtering** index
- **Category filtering** index  
- **Product number lookup** index
- **Combined brand + category** index
- **Recent products** timestamp index

## Security Features

- **Row Level Security (RLS)** enabled
- **Read access** for all authenticated users
- **Write access** with proper user attribution
- **Audit trail** for all changes

## Troubleshooting

### Migration Fails
- Check that you have proper database permissions
- Verify Supabase connection is working
- Look for any existing products table that might conflict

### RLS Issues
- Ensure you're testing with an authenticated user
- Check that auth policies are properly applied

### Performance Issues
- Verify indexes were created successfully
- Check query execution plans for complex searches

## Next Steps

After successful migration:

1. ✅ Database schema is ready
2. ➡️ Proceed to Task 2: CSV Import System Foundation
3. 📝 Begin implementing the Product Library UI components

## Migration Status

- [x] Table schema created
- [x] Indexes optimized
- [x] RLS policies applied
- [x] Audit triggers configured
- [x] Data constraints validated