# Spec Requirements Document

> Spec: Lead Management & Native CRM  
> Created: 2025-07-31  
> Status: Planning  

## Overview

Implement native lead management capabilities within Volteus, enabling teams to create, manage, and convert leads independently of external CRM systems. This spec builds upon the Monday.com integration to provide a complete lead lifecycle management system with qualification, conversion tracking, and automated workflow features.

## User Stories

### Lead Creation & Management
- *As a Sales Rep, I want to create new leads manually so that I can capture prospects from phone calls, trade shows, and referrals.*
- *As a Marketing Manager, I want to import leads from CSV files so that I can add campaign-generated leads efficiently.*
- *As a Sales Manager, I want to assign leads to team members so that workload is distributed appropriately.*

### Lead Qualification & Tracking
- *As a Sales Rep, I want to track lead status (New, Contacted, Qualified, Proposal, Closed) so that I can monitor progress through the sales funnel.*
- *As a Sales Rep, I want to add notes and call logs to leads so that I can track all interactions and follow-ups.*
- *As a Business Owner, I want to see lead conversion rates by source so that I can optimize marketing spend.*

### Integration & Conversion
- *As a Sales Rep, I want to convert qualified leads to customers so that I can begin the project workflow.*
- *As a Sales Rep, I want to create quotes directly from leads so that the transition from prospect to project is seamless.*
- *As a Data Manager, I want to merge duplicate leads so that our CRM stays clean and accurate.*

### Reporting & Analytics
- *As a Sales Manager, I want to see lead pipeline reports so that I can forecast revenue and identify bottlenecks.*
- *As a Business Owner, I want to track lead response times so that we can improve our sales process efficiency.*

## Spec Scope

### In Scope
1. **Native Lead Database**
   - `leads_native` table with comprehensive lead data
   - Lead source tracking (Manual, CSV Import, Web Form, Referral)
   - Lead status pipeline (New → Contacted → Qualified → Proposal → Closed Won/Lost)
   - Lead assignment and ownership management

2. **Lead Creation & Import**
   - Manual lead creation form with validation
   - CSV import functionality with column mapping
   - Duplicate detection and merge suggestions
   - Bulk lead operations (assign, update status, export)

3. **Lead Management Interface**
   - Comprehensive lead list with filtering and search
   - Individual lead detail pages with interaction history
   - Lead status update workflow with required fields
   - Activity timeline with notes, calls, emails, and tasks

4. **Conversion Workflows**
   - Lead to Customer conversion process
   - Lead to Quote generation workflow
   - Automatic data transfer and relationship creation
   - Conversion tracking and reporting

5. **Analytics & Reporting**
   - Lead pipeline dashboard with funnel visualization
   - Source performance analytics
   - Conversion rate tracking by rep and time period
   - Lead response time and follow-up metrics

### Out of Scope
- **Email integration** (planned for future spec)
- **Automated lead scoring** (planned for AI enhancement)
- **Website form capture** (requires separate web form spec)
- **Phone integration** (planned for communication spec)

## Technical Implementation

### Database Schema
```sql
-- Native leads table
CREATE TABLE leads_native (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  assigned_to UUID REFERENCES user_profiles(id),
  
  -- Contact Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  
  -- Lead Details
  source TEXT NOT NULL, -- 'Manual', 'CSV_Import', 'Web_Form', 'Referral', 'Monday_Migration'
  status TEXT NOT NULL DEFAULT 'New', -- 'New', 'Contacted', 'Qualified', 'Proposal', 'Closed_Won', 'Closed_Lost'
  priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Hot'
  
  -- Business Information
  estimated_value DECIMAL(10,2),
  project_type TEXT,
  project_description TEXT,
  timeline_estimate TEXT,
  
  -- Tracking
  lead_score INTEGER DEFAULT 0,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_follow_up_date TIMESTAMP WITH TIME ZONE,
  
  -- Conversion
  converted_to_customer_id UUID REFERENCES customers(id),
  converted_to_quote_id UUID REFERENCES quotes(id),
  conversion_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- RLS
  CONSTRAINT leads_native_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Lead activity log
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID NOT NULL REFERENCES leads_native(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL, -- 'Note', 'Call', 'Email', 'Meeting', 'Status_Change', 'Assignment'
  subject TEXT,
  content TEXT,
  
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Design
```typescript
// Lead management endpoints
GET    /api/leads                 // List leads with filters
POST   /api/leads                 // Create new lead
GET    /api/leads/[id]            // Get lead details
PUT    /api/leads/[id]            // Update lead
DELETE /api/leads/[id]            // Delete lead

POST   /api/leads/import          // CSV import
POST   /api/leads/[id]/convert    // Convert to customer/quote
POST   /api/leads/[id]/activities // Add activity/note

GET    /api/leads/analytics       // Pipeline and conversion metrics
```

### User Interface Components
1. **Leads List Page**
   - Data table with sorting, filtering, and pagination
   - Bulk actions (assign, status update, export)
   - Search across all lead fields
   - Status pipeline visualization

2. **Lead Detail Page**
   - Contact information and lead details
   - Activity timeline with chronological history
   - Quick actions (call, email, schedule follow-up)
   - Conversion buttons (to customer, to quote)

3. **Lead Creation Form**
   - Multi-step form with validation
   - Source selection and tracking
   - Assignment and initial status setting
   - Duplicate detection warnings

4. **CSV Import Interface**
   - File upload with drag-and-drop
   - Column mapping interface
   - Preview and validation
   - Import progress and error reporting

## Success Metrics

### Functional Requirements
- [ ] Create, read, update, delete leads seamlessly
- [ ] Import leads from CSV with validation and error handling
- [ ] Track lead progression through defined status pipeline
- [ ] Convert leads to customers and quotes with data preservation
- [ ] Search and filter leads by multiple criteria
- [ ] Assign leads to team members with notification system

### Performance Requirements
- [ ] Lead list loads in under 2 seconds with 1000+ records
- [ ] Search results return in under 1 second
- [ ] CSV import processes 500 leads in under 30 seconds
- [ ] Page transitions under 500ms

### User Experience Requirements
- [ ] Intuitive lead creation process (under 3 minutes for complete entry)
- [ ] Clear status progression with visual indicators
- [ ] Comprehensive activity tracking visible in timeline
- [ ] Responsive design for mobile lead management

## Dependencies

- **Foundation & Security Spec**: Authentication, RBAC, database access
- **Monday.com CRM Integration Spec**: Existing contact data and UI patterns
- **Future Customer Management Spec**: Conversion target definitions
- **Future Quote Management Spec**: Quote creation workflow

## Risk Mitigation

- **Data Migration**: Provide tools to migrate Monday.com contacts to native leads
- **Performance**: Implement database indexing and pagination for large datasets
- **User Adoption**: Maintain familiar UI patterns from Monday.com integration
- **Data Loss**: Comprehensive audit logging and backup procedures

## Future Enhancements

1. **Advanced Features**
   - Automated lead scoring based on engagement
   - Email integration with activity tracking
   - Calendar integration for follow-up scheduling

2. **Analytics Enhancement**
   - Predictive conversion analytics
   - Lead source ROI analysis
   - Team performance comparisons

3. **Automation**
   - Automated lead assignment rules
   - Follow-up reminder system
   - Lead nurturing email sequences

## Implementation Timeline

**Week 1**: Database schema and core API endpoints  
**Week 2**: Lead list and detail pages  
**Week 3**: Lead creation and CSV import  
**Week 4**: Conversion workflows and analytics  
**Week 5**: Testing, refinement, and documentation