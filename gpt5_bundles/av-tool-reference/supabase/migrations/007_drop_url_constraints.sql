-- Remove restrictive URL format constraints to allow flexible data import
ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_urls_format;
ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_product_id_format;