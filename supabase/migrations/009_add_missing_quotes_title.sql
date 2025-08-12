-- Ensure title column exists on quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS title TEXT;

-- Refresh PostgREST schema cache after modification
NOTIFY pgrst, 'reload schema';
