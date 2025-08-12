# Database Debugging Checklist

## Issue: "Could not find column in schema cache" (PGRST204)

**Date:** 2025-01-08  
**Context:** Quote creation failing with `PGRST204` errors for missing columns

### Root Cause Analysis

**Problem:** PostgREST schema cache was out of sync with actual database schema
- Database had columns but PostgREST API couldn't see them
- Multiple migrations were run but cache wasn't refreshed properly

### Debugging Steps That Worked

#### 1. **Check Actual Database Schema** ✅
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quotes' AND table_schema = 'public'
ORDER BY ordinal_position;
```

#### 2. **Compare with Application Code** ✅
- Check what fields the API is trying to insert
- Look at console logs to see exact payload being sent
- Verify field names match between code and database

#### 3. **Schema Cache Issues** ✅
- PostgREST caches table schemas for performance
- After schema changes, cache must be refreshed
- `NOTIFY pgrst, 'reload schema';` doesn't always work

#### 4. **Force Schema Reload** ✅
- Supabase Dashboard → Settings → API → "Restart API"
- This forces a complete schema cache refresh

### What We Learned

#### ❌ **What Didn't Work:**
- Multiple `NOTIFY pgrst, 'reload schema';` commands
- Adding columns with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Waiting for automatic cache refresh

#### ✅ **What Fixed It:**
- Identifying missing `title` column via schema query
- Adding the missing column: `ALTER TABLE quotes ADD COLUMN title TEXT;`
- Manual API restart in Supabase Dashboard

### Prevention Checklist

#### Before Debugging Application Code:
1. **Verify database schema matches expectations**
   ```sql
   \d+ table_name  -- PostgreSQL
   -- OR
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'your_table';
   ```

2. **Check if PostgREST can see the schema**
   - Try a simple SELECT query in the application
   - Look for PGRST204 errors specifically

3. **Refresh schema cache after migrations**
   - Run `NOTIFY pgrst, 'reload schema';`
   - If that fails, restart the API server
   - Wait 30 seconds after restart before testing

4. **Verify RPC function permissions**
   ```sql
   GRANT EXECUTE ON FUNCTION function_name() TO authenticated;
   GRANT EXECUTE ON FUNCTION function_name() TO service_role;
   ```

### Common Patterns

#### Schema Cache Issues Happen When:
- Running multiple migrations in sequence
- Adding columns to existing tables
- Creating new tables with complex relationships
- Modifying RPC functions

#### Signs of Schema Cache Problems:
- `PGRST204: Could not find column/table in schema cache`
- RPC functions work in SQL editor but fail in application
- Inconsistent behavior between different API calls

### Quick Fix Commands

```sql
-- Check what PostgREST can see
SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Force schema refresh
NOTIFY pgrst, 'reload schema';

-- Add missing columns safely
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name data_type;

-- Grant RPC permissions
GRANT EXECUTE ON FUNCTION function_name() TO authenticated;
```

### Future Prevention

1. **Always check schema first** when getting PGRST errors
2. **Use information_schema queries** to verify actual database state
3. **Restart API after complex migrations** as a standard practice
4. **Test one migration at a time** instead of running multiple in sequence
5. **Keep migration files updated** with actual working SQL

---

**Key Takeaway:** Database connection works ≠ Schema cache is current. Always verify the schema cache matches your expectations before debugging application code.
