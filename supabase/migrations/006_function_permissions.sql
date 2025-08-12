-- IMMEDIATE FIX: Grant execute permissions for quote creation
-- This allows authenticated users to call RPC functions

-- Generate quote numbers (CRITICAL - fixes createQuote error)
GRANT EXECUTE ON FUNCTION generate_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_quote_number() TO service_role;

-- Quote management triggers  
GRANT EXECUTE ON FUNCTION update_quotes_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION log_quote_changes() TO authenticated;

-- Note: Run 007_comprehensive_function_permissions.sql for full coverage
