-- ===================================================================
-- Migration: Quote RLS Policies
-- Description: Row-Level Security policies for quote-related tables
-- Version: 024
-- ===================================================================

-- Enable RLS on all quote tables
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_audit_log ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- QUOTES TABLE POLICIES
-- ===================================================================

-- Sales reps can see their own quotes
CREATE POLICY "sales_rep_own_quotes" ON quotes
  FOR ALL TO authenticated
  USING (sales_rep_id = auth.uid());

-- Managers can see all quotes
CREATE POLICY "manager_all_quotes" ON quotes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role' = 'manager' OR raw_user_meta_data->>'role' = 'super_admin')
    )
  );

-- Super admins can do everything
CREATE POLICY "super_admin_quotes" ON quotes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Service role has full access
CREATE POLICY "service_role_quotes" ON quotes
  FOR ALL TO service_role
  USING (true);

-- ===================================================================
-- QUOTE OPTIONS POLICIES (inherit from parent quote)
-- ===================================================================

CREATE POLICY "quote_options_inherit_permissions" ON quote_options
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_options.quote_id
      AND (
        q.sales_rep_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = auth.uid()
          AND u.raw_user_meta_data->>'role' IN ('manager', 'super_admin')
        )
      )
    )
  );

CREATE POLICY "service_role_quote_options" ON quote_options
  FOR ALL TO service_role
  USING (true);

-- ===================================================================
-- QUOTE AREAS POLICIES (inherit from parent quote via option)
-- ===================================================================

CREATE POLICY "quote_areas_inherit_permissions" ON quote_areas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quote_options qo
      JOIN quotes q ON q.id = qo.quote_id
      WHERE qo.id = quote_areas.quote_option_id
      AND (
        q.sales_rep_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = auth.uid()
          AND u.raw_user_meta_data->>'role' IN ('manager', 'super_admin')
        )
      )
    )
  );

CREATE POLICY "service_role_quote_areas" ON quote_areas
  FOR ALL TO service_role
  USING (true);

-- ===================================================================
-- QUOTE EQUIPMENT POLICIES (inherit from parent quote via area->option)
-- ===================================================================

CREATE POLICY "quote_equipment_inherit_permissions" ON quote_equipment
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quote_areas qa
      JOIN quote_options qo ON qo.id = qa.quote_option_id
      JOIN quotes q ON q.id = qo.quote_id
      WHERE qa.id = quote_equipment.quote_area_id
      AND (
        q.sales_rep_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = auth.uid()
          AND u.raw_user_meta_data->>'role' IN ('manager', 'super_admin')
        )
      )
    )
  );

CREATE POLICY "service_role_quote_equipment" ON quote_equipment
  FOR ALL TO service_role
  USING (true);

-- ===================================================================
-- QUOTE LABOR POLICIES (inherit from parent quote via option)
-- ===================================================================

CREATE POLICY "quote_labor_inherit_permissions" ON quote_labor
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quote_options qo
      JOIN quotes q ON q.id = qo.quote_id
      WHERE qo.id = quote_labor.quote_option_id
      AND (
        q.sales_rep_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = auth.uid()
          AND u.raw_user_meta_data->>'role' IN ('manager', 'super_admin')
        )
      )
    )
  );

CREATE POLICY "service_role_quote_labor" ON quote_labor
  FOR ALL TO service_role
  USING (true);

-- ===================================================================
-- TECHNICIANS POLICIES
-- ===================================================================

-- All authenticated users can view active technicians (for quote building)
CREATE POLICY "view_active_technicians" ON technicians
  FOR SELECT TO authenticated
  USING (employment_status = 'active' AND is_available_for_quotes = true);

-- Managers and super admins can manage technicians
CREATE POLICY "manage_technicians" ON technicians
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('manager', 'super_admin')
    )
  );

-- Technicians can view their own record
CREATE POLICY "technician_own_record" ON technicians
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "service_role_technicians" ON technicians
  FOR ALL TO service_role
  USING (true);

-- ===================================================================
-- SUBCONTRACTORS POLICIES
-- ===================================================================

-- All authenticated users can view active subcontractors (for quote building)
CREATE POLICY "view_active_subcontractors" ON subcontractors
  FOR SELECT TO authenticated
  USING (contractor_status = 'active' AND is_available_for_quotes = true);

-- Managers and super admins can manage subcontractors
CREATE POLICY "manage_subcontractors" ON subcontractors
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('manager', 'super_admin')
    )
  );

CREATE POLICY "service_role_subcontractors" ON subcontractors
  FOR ALL TO service_role
  USING (true);

-- ===================================================================
-- QUOTE COMMUNICATIONS POLICIES (inherit from parent quote)
-- ===================================================================

CREATE POLICY "quote_communications_inherit_permissions" ON quote_communications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_communications.quote_id
      AND (
        q.sales_rep_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = auth.uid()
          AND u.raw_user_meta_data->>'role' IN ('manager', 'super_admin')
        )
      )
    )
  );

CREATE POLICY "service_role_quote_communications" ON quote_communications
  FOR ALL TO service_role
  USING (true);

-- ===================================================================
-- QUOTE AUDIT LOG POLICIES (inherit from parent quote)
-- ===================================================================

-- Only managers and super admins can view audit logs
CREATE POLICY "view_quote_audit_logs" ON quote_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('manager', 'super_admin')
    )
  );

-- System can insert audit logs
CREATE POLICY "insert_quote_audit_logs" ON quote_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "service_role_quote_audit_log" ON quote_audit_log
  FOR ALL TO service_role
  USING (true);