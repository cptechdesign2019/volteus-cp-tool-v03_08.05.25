-- Migration: Add performance indexes for Product Library optimization
-- Created: 2025-07-31
-- Purpose: Optimize queries for price filtering, sorting, and pagination

BEGIN;

-- Price-based indexes for filtering and sorting
CREATE INDEX idx_products_dealer_price ON products(dealer_price) WHERE dealer_price IS NOT NULL;
CREATE INDEX idx_products_msrp ON products(msrp) WHERE msrp IS NOT NULL;
CREATE INDEX idx_products_map_price ON products(map_price) WHERE map_price IS NOT NULL;

-- Sorting optimization indexes
CREATE INDEX idx_products_product_name ON products(product_name);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Composite index for price range queries with filters
CREATE INDEX idx_products_brand_price ON products(brand, dealer_price) WHERE dealer_price IS NOT NULL;
CREATE INDEX idx_products_category_price ON products(category, dealer_price) WHERE dealer_price IS NOT NULL;

-- Index for distributor filtering (if needed in future)
CREATE INDEX idx_products_primary_distributor ON products(primary_distributor) WHERE primary_distributor IS NOT NULL;

-- Optimize COUNT queries for pagination
CREATE INDEX idx_products_count_optimized ON products(id) WHERE id IS NOT NULL;

-- Partial index for active products (future-proofing for soft deletes)
-- CREATE INDEX idx_products_active ON products(brand, category) WHERE deleted_at IS NULL;

COMMIT;