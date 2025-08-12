-- ===================================================================
-- Migration: Update Technician Hourly Rates
-- Description: Set correct hourly rates for existing technicians
-- Version: 037
-- ===================================================================

-- Update technician hourly rates
UPDATE technicians 
SET hourly_rate = 51.39, updated_at = NOW()
WHERE first_name = 'Todd' AND last_name = 'Engineer';

UPDATE technicians 
SET hourly_rate = 48.75, updated_at = NOW()
WHERE first_name = 'Austin' AND last_name = 'Lead Tech';

UPDATE technicians 
SET hourly_rate = 45.00, updated_at = NOW()
WHERE first_name = 'John' AND last_name = 'Install Tech';

UPDATE technicians 
SET hourly_rate = 37.50, updated_at = NOW()
WHERE first_name = 'Joe' AND last_name = 'Install Tech';