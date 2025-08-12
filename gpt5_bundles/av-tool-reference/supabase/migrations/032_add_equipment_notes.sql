-- ===================================================================
-- Migration: Add Equipment Notes and Customization Fields
-- Description: Add notes and custom fields to quote equipment
-- Version: 032
-- ===================================================================

-- Add equipment notes and customization fields
ALTER TABLE quote_equipment 
ADD COLUMN equipment_notes TEXT,
ADD COLUMN custom_description TEXT,
ADD COLUMN installation_notes TEXT,
ADD COLUMN special_instructions TEXT;