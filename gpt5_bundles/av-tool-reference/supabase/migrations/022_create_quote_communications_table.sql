-- ===================================================================
-- Migration: Create Quote Communications Table
-- Description: Change requests and customer-contractor communication log
-- Version: 022
-- ===================================================================

-- Create custom types for communications
CREATE TYPE communication_type AS ENUM ('change_request', 'question', 'clarification', 'acceptance', 'rejection', 'general', 'system_notification');
CREATE TYPE communication_direction AS ENUM ('customer_to_us', 'us_to_customer', 'internal');

-- Create quote_communications table
CREATE TABLE quote_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Communication details
  communication_type communication_type NOT NULL,
  direction communication_direction NOT NULL,
  subject VARCHAR(500),
  message TEXT NOT NULL,
  
  -- Sender information
  sender_name VARCHAR(200),
  sender_email VARCHAR(255),
  sender_ip_address INET,
  
  -- Status and tracking
  is_read BOOLEAN DEFAULT false,
  requires_response BOOLEAN DEFAULT false,
  response_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Attachments
  attachments JSONB,
  
  -- Email tracking
  email_message_id VARCHAR(255),
  email_delivered_at TIMESTAMP WITH TIME ZONE,
  email_opened_at TIMESTAMP WITH TIME ZONE,
  
  -- Internal notes (not visible to customer)
  internal_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_quote_communications_quote ON quote_communications(quote_id);
CREATE INDEX idx_quote_communications_type ON quote_communications(communication_type);
CREATE INDEX idx_quote_communications_direction ON quote_communications(direction);
CREATE INDEX idx_quote_communications_unread ON quote_communications(is_read) WHERE is_read = false;
CREATE INDEX idx_quote_communications_response ON quote_communications(requires_response) WHERE requires_response = true;
CREATE INDEX idx_quote_communications_created ON quote_communications(created_at DESC);

-- Grant permissions
GRANT ALL ON quote_communications TO authenticated;
GRANT ALL ON quote_communications TO service_role;