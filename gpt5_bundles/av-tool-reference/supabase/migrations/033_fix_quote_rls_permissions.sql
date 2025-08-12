-- ===================================================================
-- Migration: Fix Quote RLS Permissions
-- Description: Fix RLS policies that try to access auth.users table
-- Version: 033
-- ===================================================================

-- Drop the problematic policies that access auth.users
DROP POLICY IF EXISTS "manager_all_quotes" ON quotes;
DROP POLICY IF EXISTS "super_admin_quotes" ON quotes;

-- Create a secure function to check user roles
CREATE OR REPLACE FUNCTION check_user_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user has the required role
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_user_meta_data->>'role' = required_role
      OR raw_user_meta_data->>'role' = 'super_admin'
    )
  );
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_user_role(text) TO authenticated;

-- Recreate the manager policy using the secure function
CREATE POLICY "manager_all_quotes" ON quotes
  FOR ALL TO authenticated
  USING (check_user_role('manager'));

-- Recreate the super admin policy using the secure function
CREATE POLICY "super_admin_quotes" ON quotes
  FOR ALL TO authenticated
  USING (check_user_role('super_admin'));

-- Fix similar issues in quote_options policies
DROP POLICY IF EXISTS "quote_options_inherit_permissions" ON quote_options;

CREATE POLICY "quote_options_inherit_permissions" ON quote_options
  FOR ALL TO authenticated
  USING (
    -- Sales rep can access their own quote options
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_options.quote_id
      AND q.sales_rep_id = auth.uid()
    )
    OR
    -- Managers and super admins can access all
    check_user_role('manager')
  );

-- Fix similar issues in quote_areas policies  
DROP POLICY IF EXISTS "quote_areas_inherit_permissions" ON quote_areas;

CREATE POLICY "quote_areas_inherit_permissions" ON quote_areas
  FOR ALL TO authenticated
  USING (
    -- Sales rep can access their own quote areas
    EXISTS (
      SELECT 1 FROM quotes q
      JOIN quote_options qo ON qo.quote_id = q.id
      WHERE qo.id = quote_areas.quote_option_id
      AND q.sales_rep_id = auth.uid()
    )
    OR
    -- Managers and super admins can access all
    check_user_role('manager')
  );

-- Fix similar issues in quote_equipment policies
DROP POLICY IF EXISTS "quote_equipment_inherit_permissions" ON quote_equipment;

CREATE POLICY "quote_equipment_inherit_permissions" ON quote_equipment
  FOR ALL TO authenticated
  USING (
    -- Sales rep can access their own quote equipment
    EXISTS (
      SELECT 1 FROM quotes q
      JOIN quote_options qo ON qo.quote_id = q.id
      JOIN quote_areas qa ON qa.quote_option_id = qo.id
      WHERE qa.id = quote_equipment.quote_area_id
      AND q.sales_rep_id = auth.uid()
    )
    OR
    -- Managers and super admins can access all
    check_user_role('manager')
  );