-- ===================================================================
-- Migration: Create Technicians Table
-- Description: Internal team members with rates and specializations
-- Version: 019
-- ===================================================================

-- Create custom types for technicians
CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'terminated', 'on_leave');
CREATE TYPE skill_level AS ENUM ('engineer', 'lead_tech', 'install_tech', 'apprentice');

-- Create technicians table
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Personal information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Employment details
  employee_id VARCHAR(50) UNIQUE,
  hire_date DATE,
  employment_status employment_status DEFAULT 'active',
  
  -- Rate information
  hourly_rate DECIMAL(8,2) NOT NULL,
  skill_level skill_level DEFAULT 'install_tech',
  specializations TEXT[],
  
  -- Scheduling and availability
  default_hours_per_day DECIMAL(4,2) DEFAULT 8.00,
  is_available_for_quotes BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT positive_technician_rate CHECK (hourly_rate >= 0),
  CONSTRAINT valid_hours_per_day CHECK (default_hours_per_day > 0 AND default_hours_per_day <= 24)
);

-- Create indexes
CREATE INDEX idx_technicians_status ON technicians(employment_status);
CREATE INDEX idx_technicians_available ON technicians(is_available_for_quotes) WHERE is_available_for_quotes = true;
CREATE INDEX idx_technicians_user ON technicians(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_technicians_skill ON technicians(skill_level);
CREATE INDEX idx_technicians_specializations ON technicians USING GIN(specializations);

-- Add updated_at trigger
CREATE TRIGGER technicians_updated_at
  BEFORE UPDATE ON technicians
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

-- Grant permissions
GRANT ALL ON technicians TO authenticated;
GRANT ALL ON technicians TO service_role;

-- Insert initial technician data based on user requirements
INSERT INTO technicians (
  first_name, 
  last_name, 
  email, 
  employee_id,
  hourly_rate,
  skill_level,
  specializations,
  employment_status,
  hire_date,
  created_by
) VALUES 
  (
    'Todd', 
    'Engineer', 
    'todd@clearpointtechdesign.com',
    'EMP001',
    75.00,
    'engineer',
    ARRAY['programming', 'design', 'system_engineering'],
    'active',
    '2020-01-01',
    (SELECT id FROM auth.users WHERE email = 'todd@clearpointtechdesign.com' LIMIT 1)
  ),
  (
    'Austin',
    'Lead Tech',
    'austin@clearpointtechdesign.com',
    'EMP002', 
    35.00,
    'lead_tech',
    ARRAY['installation', 'troubleshooting', 'team_leadership'],
    'active',
    '2021-01-01',
    (SELECT id FROM auth.users WHERE email = 'todd@clearpointtechdesign.com' LIMIT 1)
  ),
  (
    'John',
    'Install Tech',
    'john@clearpointtechdesign.com',
    'EMP003',
    25.00,
    'install_tech', 
    ARRAY['installation', 'mounting', 'cable_running'],
    'active',
    '2022-01-01',
    (SELECT id FROM auth.users WHERE email = 'todd@clearpointtechdesign.com' LIMIT 1)
  ),
  (
    'Joe',
    'Install Tech',
    'joe@clearpointtechdesign.com',
    'EMP004',
    25.00,
    'install_tech',
    ARRAY['installation', 'mounting', 'cable_running'],
    'active',
    '2022-06-01',
    (SELECT id FROM auth.users WHERE email = 'todd@clearpointtechdesign.com' LIMIT 1)
  );