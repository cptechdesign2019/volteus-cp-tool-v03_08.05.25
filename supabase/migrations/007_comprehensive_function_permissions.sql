-- ===================================================================
-- Comprehensive Function Permissions
-- Based on Todd's proven patterns to prevent RPC permission issues
-- ===================================================================

-- QUOTES FUNCTIONS
-- Generate quote numbers (critical for quote creation)
GRANT EXECUTE ON FUNCTION generate_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_quote_number() TO service_role;

-- Quote management functions
GRANT EXECUTE ON FUNCTION update_quotes_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION log_quote_changes() TO authenticated;

-- CUSTOMER FUNCTIONS  
-- Customer account management
GRANT EXECUTE ON FUNCTION update_customer_accounts_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION set_customer_accounts_created_by() TO authenticated;

-- Customer contacts management
GRANT EXECUTE ON FUNCTION update_customer_contacts_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION set_customer_contacts_created_by() TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_single_primary_contact() TO authenticated;

-- PRODUCT FUNCTIONS
-- Product management
GRANT EXECUTE ON FUNCTION update_products_audit() TO authenticated;

-- FUTURE-PROOFING: Common RPC patterns we'll need
-- Note: These functions will be added in future migrations, permissions ready

-- Search and statistics functions (Phase 1)
-- GRANT EXECUTE ON FUNCTION search_quotes(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_quote_statistics(UUID, DATE, DATE) TO authenticated;

-- Quote calculation functions (Phase 2)  
-- GRANT EXECUTE ON FUNCTION calculate_quote_totals(UUID) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_quote_calculations(UUID) TO authenticated;

-- Advanced quote functions (Phase 2)
-- GRANT EXECUTE ON FUNCTION get_quote_with_options(UUID) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_quote_areas_rpc(UUID) TO authenticated;

-- Customer search functions (Setup Wizard)
-- GRANT EXECUTE ON FUNCTION search_customers(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_customer_statistics() TO authenticated;

-- ===================================================================
-- SECURITY DEFINER PATTERN
-- Many functions will need SECURITY DEFINER to bypass RLS
-- This will be added to individual function definitions as needed
-- ===================================================================

-- Note: When creating new RPC functions, remember to:
-- 1. Add SECURITY DEFINER if function needs to bypass RLS
-- 2. Add both authenticated AND service_role permissions
-- 3. Set proper search_path = public for security
