-- Migration: Quotes Management System Database Schema
-- Created: 2025-01-08
-- Description: Complete database schema for quotes management system

-- Helper functions for testing (create first)
CREATE OR REPLACE FUNCTION create_test_helper_functions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Function to get table columns for testing
  CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
  RETURNS TABLE(
    column_name text,
    data_type text,
    is_nullable text,
    column_default text
  )
  LANGUAGE plpgsql
  AS $func$
  BEGIN
    RETURN QUERY
    SELECT 
      c.column_name::text,
      c.data_type::text,
      c.is_nullable::text,
      c.column_default::text
    FROM information_schema.columns c
    WHERE c.table_name = $1
      AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
  END;
  $func$;

  -- Function to get table constraints for testing
  CREATE OR REPLACE FUNCTION get_table_constraints(table_name text)
  RETURNS TABLE(
    constraint_name text,
    constraint_type text,
    column_name text
  )
  LANGUAGE plpgsql
  AS $func$
  BEGIN
    RETURN QUERY
    SELECT 
      tc.constraint_name::text,
      tc.constraint_type::text,
      kcu.column_name::text
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = $1
      AND tc.table_schema = 'public'
    ORDER BY tc.constraint_name;
  END;
  $func$;

  -- Function to get foreign keys for testing
  CREATE OR REPLACE FUNCTION get_foreign_keys(table_name text)
  RETURNS TABLE(
    column_name text,
    foreign_table_name text,
    foreign_column_name text
  )
  LANGUAGE plpgsql
  AS $func$
  BEGIN
    RETURN QUERY
    SELECT 
      kcu.column_name::text,
      ccu.table_name::text AS foreign_table_name,
      ccu.column_name::text AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
      AND tc.table_schema = 'public';
  END;
  $func$;

  -- Function to get table indexes for testing
  CREATE OR REPLACE FUNCTION get_table_indexes(table_name text)
  RETURNS TABLE(
    indexname text,
    indexdef text
  )
  LANGUAGE plpgsql
  AS $func$
  BEGIN
    RETURN QUERY
    SELECT 
      i.indexname::text,
      i.indexdef::text
    FROM pg_indexes i
    WHERE i.tablename = $1
      AND i.schemaname = 'public'
    ORDER BY i.indexname;
  END;
  $func$;
END;
$$;

-- Create helper functions
SELECT create_test_helper_functions();

-- =============================================
-- QUOTES MANAGEMENT SYSTEM SCHEMA
-- =============================================

-- 1. TECHNICIANS TABLE
CREATE TABLE technicians (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  hourly_rate NUMERIC NOT NULL CHECK (hourly_rate >= 0),
  specializations TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SUBCONTRACTORS TABLE  
CREATE TABLE subcontractors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  day_rate DECIMAL(10,2) NOT NULL CHECK (day_rate >= 0),
  specializations TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MAIN QUOTES TABLE
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT UNIQUE NOT NULL, -- CPQ-YYXXX format
  title TEXT NOT NULL, -- Quote title/name (REQUIRED)
  description TEXT,
  customer_id uuid NOT NULL REFERENCES customer_accounts(id),
  sales_rep_id uuid NOT NULL REFERENCES auth.users(id), -- Make required
  quote_status TEXT NOT NULL CHECK (
    quote_status IN ('draft', 'sent', 'pending_changes', 'accepted', 'expired', 'archived')
  ) DEFAULT 'draft',
  total_price NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  gross_profit_margin NUMERIC NOT NULL DEFAULT 0,
  expiration_date TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by uuid REFERENCES auth.users(id),
  notes TEXT,
  tags JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id)
);

-- 4. QUOTE OPTIONS TABLE (for variations)
CREATE TABLE quote_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL,
  option_description TEXT,
  total_equipment_cost DECIMAL(12,2) DEFAULT 0,
  total_labor_cost DECIMAL(12,2) DEFAULT 0,
  total_customer_price DECIMAL(12,2) DEFAULT 0,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. QUOTE AREAS TABLE (rooms/spaces)
CREATE TABLE quote_areas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_option_id uuid NOT NULL REFERENCES quote_options(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. QUOTE EQUIPMENT TABLE
CREATE TABLE quote_equipment (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_area_id uuid NOT NULL REFERENCES quote_areas(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. QUOTE LABOR TABLE
CREATE TABLE quote_labor (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_option_id uuid NOT NULL REFERENCES quote_options(id) ON DELETE CASCADE,
  labor_type TEXT NOT NULL, -- e.g., 'Installation', 'Programming', 'Travel'
  hours NUMERIC NOT NULL DEFAULT 0 CHECK (hours >= 0),
  rate NUMERIC NOT NULL DEFAULT 0 CHECK (rate >= 0),
  total_price NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. QUOTE COMMUNICATIONS TABLE
CREATE TABLE quote_communications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL CHECK (
    communication_type IN ('email', 'phone', 'meeting', 'change_request', 'note')
  ),
  subject TEXT,
  message TEXT NOT NULL,
  from_user_id UUID REFERENCES auth.users(id),
  to_customer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. QUOTE AUDIT LOG TABLE
CREATE TABLE quote_audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'sent', 'accepted', etc.
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Quotes table indexes
CREATE INDEX quotes_customer_id_idx ON quotes (customer_id);
CREATE INDEX quotes_sales_rep_id_idx ON quotes (sales_rep_id);
CREATE INDEX quotes_status_idx ON quotes (quote_status);
CREATE INDEX quotes_quote_number_idx ON quotes (quote_number);

-- Quote options indexes
CREATE INDEX quote_options_quote_id_idx ON quote_options (quote_id);

-- Quote areas indexes
CREATE INDEX quote_areas_quote_option_id_idx ON quote_areas (quote_option_id);

-- Quote equipment indexes  
CREATE INDEX quote_equipment_quote_area_id_idx ON quote_equipment (quote_area_id);
CREATE INDEX quote_equipment_product_id_idx ON quote_equipment (product_id);

-- Quote labor indexes
CREATE INDEX quote_labor_quote_option_id_idx ON quote_labor (quote_option_id);

-- Communication and audit indexes
CREATE INDEX idx_quote_communications_quote_id ON quote_communications(quote_id);
CREATE INDEX idx_quote_communications_created_at ON quote_communications(created_at DESC);
CREATE INDEX idx_quote_audit_log_quote_id ON quote_audit_log(quote_id);
CREATE INDEX idx_quote_audit_log_created_at ON quote_audit_log(created_at DESC);

-- Team management indexes
CREATE INDEX idx_technicians_active ON technicians(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_subcontractors_active ON subcontractors(is_active) WHERE is_active = TRUE;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_audit_log ENABLE ROW LEVEL SECURITY;

-- Technicians policies
CREATE POLICY "Users can view active technicians" ON technicians
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "Admins can manage technicians" ON technicians
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Subcontractors policies  
CREATE POLICY "Users can view active subcontractors" ON subcontractors
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "Admins can manage subcontractors" ON subcontractors
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Quotes policies
CREATE POLICY "Users can view quotes they have access to" ON quotes
  FOR SELECT USING (
    auth.uid() = sales_rep_id OR 
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can create quotes" ON quotes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own quotes" ON quotes
  FOR UPDATE USING (
    auth.uid() = sales_rep_id OR 
    auth.uid() = created_by OR
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Quote sub-table policies (inherit from quotes access)
CREATE POLICY "Users can access quote options" ON quote_options
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM quotes WHERE 
        auth.uid() = sales_rep_id OR 
        auth.uid() = created_by OR
        auth.uid() IN (
          SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    )
  );

CREATE POLICY "Users can access quote areas" ON quote_areas
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM quotes WHERE 
        auth.uid() = sales_rep_id OR 
        auth.uid() = created_by OR
        auth.uid() IN (
          SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    )
  );

CREATE POLICY "Users can access quote equipment" ON quote_equipment
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM quotes WHERE 
        auth.uid() = sales_rep_id OR 
        auth.uid() = created_by OR
        auth.uid() IN (
          SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    )
  );

CREATE POLICY "Users can access quote labor" ON quote_labor
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM quotes WHERE 
        auth.uid() = sales_rep_id OR 
        auth.uid() = created_by OR
        auth.uid() IN (
          SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    )
  );

CREATE POLICY "Users can access quote communications" ON quote_communications
  FOR ALL USING (
    quote_id IN (
      SELECT id FROM quotes WHERE 
        auth.uid() = sales_rep_id OR 
        auth.uid() = created_by OR
        auth.uid() IN (
          SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    )
  );

CREATE POLICY "Users can view quote audit log" ON quote_audit_log
  FOR SELECT USING (
    quote_id IN (
      SELECT id FROM quotes WHERE 
        auth.uid() = sales_rep_id OR 
        auth.uid() = created_by OR
        auth.uid() IN (
          SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    )
  );

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_quotes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate quote numbers
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  new_quote_number TEXT; -- Renamed variable
BEGIN
  -- Get last 2 digits of current year
  year_suffix := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
  
  -- Get next sequential number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN quotes.quote_number ~ ('^CPQ-' || year_suffix || '[0-9]{3}$') -- Explicitly reference table column
      THEN SUBSTRING(quotes.quote_number FROM LENGTH('CPQ-' || year_suffix) + 1)::INTEGER
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM quotes;
  
  -- Format as CPQ-YYXXX
  new_quote_number := 'CPQ-' || year_suffix || LPAD(next_number::TEXT, 3, '0');
  
  RETURN new_quote_number;
END;
$$ LANGUAGE plpgsql;

-- Function to audit quote changes
CREATE OR REPLACE FUNCTION log_quote_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO quote_audit_log (quote_id, action, user_id)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps on quotes
CREATE TRIGGER quotes_update_timestamp
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_timestamp();

-- Update timestamps on other tables
CREATE TRIGGER quote_options_update_timestamp
  BEFORE UPDATE ON quote_options
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_timestamp();

CREATE TRIGGER quote_areas_update_timestamp
  BEFORE UPDATE ON quote_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_timestamp();

CREATE TRIGGER quote_equipment_update_timestamp
  BEFORE UPDATE ON quote_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_timestamp();

CREATE TRIGGER quote_labor_update_timestamp
  BEFORE UPDATE ON quote_labor
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_timestamp();

-- Audit logging
CREATE TRIGGER quotes_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION log_quote_changes();

-- =============================================
-- SAMPLE DATA (for testing)
-- =============================================

-- Insert sample technicians
INSERT INTO technicians (name, hourly_rate, specializations) VALUES
('John Smith', 75.00, '{"Audio Systems", "Video Systems"}'),
('Sarah Johnson', 85.00, '{"Control Systems", "Programming"}'),
('Mike Wilson', 70.00, '{"Installation", "Mounting"}');

-- Insert sample subcontractors
INSERT INTO subcontractors (company_name, contact_name, email, phone, day_rate, specializations) VALUES
('Elite AV Solutions', 'Dave Brown', 'dave@eliteav.com', '555-0123', 800.00, '{"Custom Programming", "Advanced Integration"}'),
('Quick Install Co', 'Lisa Garcia', 'lisa@quickinstall.com', '555-0456', 600.00, '{"Installation", "Cable Running"}');
