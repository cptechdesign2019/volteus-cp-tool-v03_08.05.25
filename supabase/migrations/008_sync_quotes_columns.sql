-- Sync quotes table columns with application expectations
-- This adds any missing columns used by the API payload to avoid REST schema cache mismatches

-- Quotes core optional fields
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;

-- Pricing fields (ensure exist with safe defaults)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS gross_profit_margin NUMERIC DEFAULT 0;

-- Status (leave default only; do not force NOT NULL here to avoid conflicts)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_status TEXT DEFAULT 'draft';

-- Audit fields (nullable to avoid retroactive constraint issues)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS updated_by uuid;

-- Add FKs if not present (safe guard; will no-op if already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quotes_created_by_fkey'
  ) THEN
    ALTER TABLE quotes
      ADD CONSTRAINT quotes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quotes_updated_by_fkey'
  ) THEN
    ALTER TABLE quotes
      ADD CONSTRAINT quotes_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
  END IF;
END $$;

-- Finally, refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';


