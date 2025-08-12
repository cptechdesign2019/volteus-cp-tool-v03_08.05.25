-- Fix Quotes RLS Policies
-- The original policies were too complex and referenced user roles that don't exist yet
-- Simplifying to match customer_accounts pattern

-- Drop existing complex policies
DROP POLICY IF EXISTS "Users can view quotes they have access to" ON quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;

DROP POLICY IF EXISTS "Users can access quote options" ON quote_options;
DROP POLICY IF EXISTS "Users can access quote areas" ON quote_areas;
DROP POLICY IF EXISTS "Users can access quote equipment" ON quote_equipment;
DROP POLICY IF EXISTS "Users can access quote labor" ON quote_labor;
DROP POLICY IF EXISTS "Users can access quote communications" ON quote_communications;
DROP POLICY IF EXISTS "Users can view quote audit log" ON quote_audit_log;

-- Create simple, working RLS policies for quotes
CREATE POLICY "Users can read quotes" ON quotes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert quotes" ON quotes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update quotes" ON quotes
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Users can delete quotes" ON quotes
  FOR DELETE TO authenticated
  USING (true);

-- Simple policies for quote sub-tables
CREATE POLICY "Users can access quote options" ON quote_options
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Users can access quote areas" ON quote_areas
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Users can access quote equipment" ON quote_equipment
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Users can access quote labor" ON quote_labor
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Users can access quote communications" ON quote_communications
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Users can access quote audit log" ON quote_audit_log
  FOR ALL TO authenticated
  USING (true);

-- Simple policies for support tables
DROP POLICY IF EXISTS "Users can view active technicians" ON technicians;
DROP POLICY IF EXISTS "Admins can manage technicians" ON technicians;
CREATE POLICY "Users can access technicians" ON technicians
  FOR ALL TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can view active subcontractors" ON subcontractors;
DROP POLICY IF EXISTS "Admins can manage subcontractors" ON subcontractors;
CREATE POLICY "Users can access subcontractors" ON subcontractors
  FOR ALL TO authenticated
  USING (true);
