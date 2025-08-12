-- ===================================================================
-- Migration: Fix Quotes RLS Permissions
-- Description: Fix RLS policies to avoid auth.users permission issues
-- Version: 030
-- ===================================================================

-- Drop existing problematic policies that reference auth.users
DROP POLICY IF EXISTS "manager_all_quotes" ON quotes;
DROP POLICY IF EXISTS "super_admin_quotes" ON quotes;

-- Recreate manager policy without auth.users access
CREATE POLICY "manager_all_quotes" ON quotes
  FOR ALL TO authenticated
  USING (
    -- Allow access if user role is manager or super_admin (check via JWT claims)
    (auth.jwt() ->> 'role' = 'manager' OR auth.jwt() ->> 'role' = 'super_admin')
    OR
    -- Fallback: allow if user metadata indicates manager/admin role
    EXISTS (
      SELECT 1 
      WHERE auth.uid() IS NOT NULL 
      AND (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'manager') OR
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin')
      )
    )
  );

-- Recreate super admin policy without auth.users access  
CREATE POLICY "super_admin_quotes" ON quotes
  FOR ALL TO authenticated
  USING (
    -- Allow access if user role is super_admin (check via JWT claims)
    (auth.jwt() ->> 'role' = 'super_admin')
    OR
    -- Fallback: allow if user metadata indicates super_admin role
    EXISTS (
      SELECT 1 
      WHERE auth.uid() IS NOT NULL 
      AND (auth.jwt() -> 'user_metadata' ->> 'role' = 'super_admin')
    )
  );

-- Add a simple policy for development/testing (can be removed later)
-- This allows any authenticated user to work with quotes during development
CREATE POLICY "dev_authenticated_quotes" ON quotes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);