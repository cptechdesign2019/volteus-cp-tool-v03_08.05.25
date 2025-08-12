# Spec Requirements Document - Quotes Management System

> **Spec:** Quotes Management System (Adapted from Todd's Proven System)  
> **Created:** 2025-01-08  
> **Status:** 📋 READY FOR IMPLEMENTATION  
> **Complexity:** XL (Most Complex Feature)  
> **Estimated Duration:** 6-8 weeks (Phased Implementation)  
> **Priority:** 🔥 HIGH - Core Revenue Engine

## Overview

The Quotes Management System is the **core revenue engine** of Volteus, transforming customer inquiries into professional quotes and managing the complete quote-to-project lifecycle. This system integrates with our existing Customer Management and Product Library modules while introducing advanced features for team management, labor calculations, AI-powered scope generation, and customer interaction.

**Based on:** Todd's proven quotes system with 8+ working features, adapted for Volteus infrastructure and Clearpoint branding.

## Core Business Objectives

### Primary Goals
- **Streamline Quote Creation:** Reduce quote building time from hours to minutes
- **Increase Quote Accuracy:** Eliminate pricing errors and ensure consistent profit margins  
- **Improve Customer Experience:** Professional quote delivery with Clearpoint branding
- **Enable Revenue Tracking:** Track sales rep performance and commission calculations
- **Automate Quote-to-Project Workflow:** Seamless transition from accepted quotes to active projects

### Success Metrics
- **Quote Creation Time:** Target <30 minutes for standard residential quotes
- **Quote Accuracy:** 99%+ pricing accuracy with automated calculations
- **Conversion Rate:** Track quote acceptance rates by sales rep and project type
- **Customer Satisfaction:** Professional quote presentation with e-signature capability
- **Profit Visibility:** Real-time GPM% tracking during quote building

## System Architecture Overview

### Database Schema Design

The Quotes Management System requires 9 core tables with sophisticated relationships:

#### Core Quote Tables
- **`quotes`** - Main quote records with status, customer, sales rep, and totals
- **`quote_options`** - Multiple variations/alternatives per quote  
- **`quote_areas`** - Room/space definitions for equipment organization
- **`quote_equipment`** - Equipment line items linked to areas and options
- **`quote_labor`** - Labor calculations with technician and subcontractor assignments

#### Team & Resource Management
- **`technicians`** - Internal team members with hourly rates and specializations
- **`subcontractors`** - External contractors with day rates and contact information
- **`quote_communications`** - Change requests and customer-contractor communication log

#### Configuration & Tracking  
- **`quote_templates`** - Reusable quote configurations for common project types
- **`quote_audit_log`** - Complete audit trail of quote changes and status updates

### Integration Points

#### Existing Volteus System Integrations
- **✅ Customer Management:** Customer selection, billing/service addresses, contact information
- **✅ Product Library:** Equipment selection, current pricing, specifications  
- **✅ User Management (RBAC):** Sales rep auto-assignment, permission-based access
- **✅ Authentication:** Secure customer quote access via unique tokens
- **✅ Design System:** Clearpoint colors, Montserrat typography, professional styling

#### External Service Integrations
- **Email Service:** Professional email delivery for quote notifications
- **AI Integration:** Intelligent scope of work generation based on equipment selection
- **E-Signature Service:** Digital signature capture for quote acceptance  
- **PDF Generation:** Professional quote documents with Clearpoint branding

## Implementation Phases

Given the complexity of this system, implementation will be divided into **4 phases** with clear deliverables and testing milestones.

### Phase 1: Foundation & Core Infrastructure (2 weeks)
**Deliverables:**
- Complete database schema implementation
- Team management system (technicians & subcontractors)
- Basic quote CRUD operations  
- Quote dashboard with status cards
- Sales rep assignment via RBAC integration
- Clearpoint design system integration

**Success Criteria:**
- Can create, view, edit, and delete basic quotes
- Team members can be added/managed with rate configuration
- Quote status workflow functions correctly
- Sales reps automatically assigned to quotes they create
- Professional Clearpoint styling throughout

### Phase 2: Quote Builder - Equipment & Labor (2 weeks)
**Deliverables:**
- 4-step quote creation workflow (Setup → Build → Review → Send)
- Equipment selection with Product Library integration
- Multi-area equipment management with drag-and-drop
- Labor calculation system with technician/subcontractor assignment
- Real-time financial calculations (cost, profit, GPM%)

**Success Criteria:**
- Complete equipment selection and area management
- Accurate labor calculations with mixed team support  
- Live profit margin calculations during quote building
- Quote options/variations with inheritance capabilities

### Phase 3: Customer Experience & AI (2 weeks)
**Deliverables:**
- AI integration for scope of work generation
- Rich text editor for quote customization
- Customer quote viewer (live HTML page) with Clearpoint branding
- E-signature system for quote acceptance
- Email notification system

**Success Criteria:**
- AI generates relevant scope of work based on equipment
- Customers can view professional quotes via secure link
- E-signature capture for quote acceptance
- Automated email notifications for all status changes

### Phase 4: Advanced Features & Polish (1-2 weeks)
**Deliverables:**
- Change request management system
- Communication logging and tracking  
- Advanced reporting and analytics
- Quote templates and automation
- Performance optimization and final testing

**Success Criteria:**
- Complete change request workflow with customer portal
- Comprehensive communication history
- Quote-to-project automation when accepted
- System handles high-volume quote processing

## Technical Specifications

### Quote Status Workflow

```
Draft → Sent → Pending Changes → Accepted → Project Created
  ↓       ↓           ↓             ↓
  ↓   Expired    Expired       Expired  
  ↓       ↓           ↓             ↓
  └─── Archived ← Archived ← Archived
```

**Status Definitions:**
- **Draft:** Work in progress, not yet sent to customer
- **Sent:** Delivered to customer, awaiting response
- **Pending Changes:** Customer requested modifications
- **Accepted:** Customer signed and approved quote
- **Expired:** Quote passed expiration date (30/60/90 days or Never)
- **Archived:** Quote closed without acceptance

### Labor Calculation Logic

**Standard Formula:**
```
Total Man Hours = (Number of Technicians × Hours per Day × Number of Days)
Total Labor Cost = (Man Hours × Hourly Rate) + (Subcontractor Days × Day Rate)
Customer Labor Price = Total Labor Cost × Markup Percentage
```

**Example Calculation:**
- 3 Technicians × 8 Hours × 1 Day = 24 Man Hours
- 24 Hours × $100/hour = $2,400 Customer Price
- Internal Cost: 24 Hours × (Average Tech Rate) = Company Cost
- Profit = Customer Price - Company Cost

### Quote Numbering System

**Format:** `CPQ-YYXXX` (Quote) → `CPP-YYXXX` (Project)
- **CPQ:** ClearPoint Quote
- **CPP:** ClearPoint Project
- **YY:** Last 2 digits of current year
- **XXX:** Sequential number starting from 001

**Examples:**
- 2025: CPQ-25001, CPQ-25002, etc.
- 2026: CPQ-26001, CPQ-26002, etc.  
- When accepted: CPQ-25001 → CPP-25001

### Financial Tracking Requirements

**Real-time Calculations:**
- **Equipment Cost vs Price:** Company cost, customer price, profit margin
- **Labor Cost vs Price:** Internal rates vs customer billing
- **Overall GPM%:** Gross Profit Margin percentage for entire quote
- **Commission Tracking:** 15% commission on gross profit for sales reps

**Tax and Shipping:**
- **Default Shipping:** 5% of equipment total (adjustable)
- **Default Tax:** 8% of total (adjustable, tax-exempt customers supported)
- **Transparency:** Customers see final amounts, not percentages

## User Experience Design

### Quote Dashboard Layout

**Card-Based Status View:**
```
[Draft Quotes: 12]  [Sent Quotes: 8]  [Pending Changes: 3]
[Accepted: 15]      [Expired: 2]      [This Month: $125K]
```

**Quote Card Information:**
- Quote number and customer name
- Total value and profit margin  
- Status and days since last update
- Assigned sales rep

### Quote Builder Workflow

**Step 1: Quote Setup**
- Customer selection from existing accounts
- Quote number auto-generation
- Expiration date setting
- Initial project details

**Step 2: Equipment & Areas**
- Area/room definition and management
- Product selection from library with search/filter
- Drag-and-drop equipment organization
- Quantity and pricing adjustments

**Step 3: Labor & Team**
- Technician assignment and hour estimation
- Subcontractor assignment and day rates
- Labor markup and pricing calculation
- Real-time profit margin display

**Step 4: Review & Send**
- AI-generated scope of work
- Quote preview with professional formatting
- Final review and adjustments
- Customer delivery via email

## Clearpoint Design Integration

### Visual Identity
- **Colors:** Navy (#162944), Royal (#203B56), Cyan (#29ABE2), Amber (#F4B400)
- **Typography:** Montserrat font family throughout
- **Logo:** Clearpoint Technology + Design branding
- **Professional Layout:** Consistent spacing, proper hierarchy

### Quote Document Styling
- **Header:** Clearpoint logo and contact information
- **Color Scheme:** Navy headers, cyan accents, professional layout
- **Typography:** Montserrat headings, clean body text
- **Footer:** Company information and terms

### Customer Portal Styling
- **Responsive Design:** Mobile-friendly quote viewing
- **Professional Appearance:** Matches company website aesthetic
- **Clear CTAs:** Prominent accept/request changes buttons
- **Progress Indicators:** Clear status and next steps

## Database Schema (Detailed)

### Core Tables

```sql
-- Main quotes table
quotes (
  id BIGINT PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL, -- CPQ-25001 format
  customer_account_id BIGINT REFERENCES customer_accounts(id),
  assigned_sales_rep_id BIGINT REFERENCES user_profiles(id),
  quote_status TEXT CHECK (quote_status IN ('draft', 'sent', 'pending_changes', 'accepted', 'expired', 'archived')),
  total_equipment_cost DECIMAL(12,2),
  total_labor_cost DECIMAL(12,2), 
  total_customer_price DECIMAL(12,2),
  gross_profit_margin DECIMAL(5,2),
  expiration_date DATE,
  scope_of_work TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Quote equipment items
quote_equipment (
  id BIGINT PRIMARY KEY,
  quote_id BIGINT REFERENCES quotes(id),
  quote_area_id BIGINT REFERENCES quote_areas(id),
  product_id BIGINT REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  line_total DECIMAL(12,2),
  equipment_notes TEXT
)

-- Quote areas/rooms
quote_areas (
  id BIGINT PRIMARY KEY,
  quote_id BIGINT REFERENCES quotes(id),
  area_name TEXT NOT NULL,
  area_description TEXT,
  display_order INTEGER
)

-- Team management
technicians (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  hourly_rate DECIMAL(8,2),
  specializations TEXT[],
  is_active BOOLEAN DEFAULT TRUE
)
```

## API Endpoints (Planned)

### Quote Management
- `GET /api/quotes` - List quotes with filtering
- `POST /api/quotes` - Create new quote
- `GET /api/quotes/[id]` - Get quote details
- `PUT /api/quotes/[id]` - Update quote
- `DELETE /api/quotes/[id]` - Archive quote

### Quote Building
- `POST /api/quotes/[id]/equipment` - Add equipment
- `PUT /api/quotes/[id]/labor` - Update labor calculations
- `POST /api/quotes/[id]/generate-scope` - AI scope generation
- `POST /api/quotes/[id]/send` - Send to customer

### Customer Portal  
- `GET /api/quotes/[token]/view` - Customer quote view
- `POST /api/quotes/[token]/accept` - Accept quote
- `POST /api/quotes/[token]/request-changes` - Request modifications

## Success Criteria & Testing

### Phase 1 Testing
- [ ] Create quotes with all required fields
- [ ] Team member management functions
- [ ] Status workflow transitions correctly
- [ ] Dashboard displays accurate statistics
- [ ] Sales rep assignment works properly

### Phase 2 Testing  
- [ ] Equipment selection from product library
- [ ] Area management with drag-and-drop
- [ ] Labor calculations match expected formulas
- [ ] Real-time financial updates
- [ ] Quote options/variations

### Phase 3 Testing
- [ ] AI scope generation produces quality content
- [ ] Customer portal displays professionally
- [ ] E-signature capture works reliably
- [ ] Email notifications sent correctly
- [ ] Quote acceptance workflow complete

### Phase 4 Testing
- [ ] Change request management
- [ ] Communication logging
- [ ] Quote-to-project conversion
- [ ] Performance under load
- [ ] Complete end-to-end workflow

## Risk Assessment & Mitigation

### Technical Risks
- **Database Complexity:** Mitigate with phased implementation and thorough testing
- **Financial Calculations:** Use Todd's proven formulas and extensive validation
- **Integration Points:** Build on existing Volteus systems with proper error handling
- **Performance:** Optimize queries and implement proper indexing

### Business Risks
- **User Adoption:** Ensure intuitive UX and comprehensive training
- **Data Migration:** Plan careful migration from existing quote systems
- **Customer Impact:** Maintain service quality during transition
- **Revenue Impact:** Implement in phases to minimize business disruption

## Future Enhancements

### Advanced Features (Post-MVP)
- **Quote Analytics:** Advanced reporting and business intelligence
- **Template Library:** Industry-specific quote templates
- **Approval Workflows:** Multi-level quote approval for large projects
- **Integration Extensions:** Accounting software, project management tools
- **Mobile App:** Native mobile app for field quote creation

### AI Enhancements
- **Smart Recommendations:** AI-powered equipment suggestions
- **Pricing Optimization:** AI-driven pricing recommendations
- **Risk Assessment:** AI analysis of quote success probability
- **Auto-Generation:** Complete quote generation from customer requirements

## Spec Documentation

- Tasks: @.agent-os/specs/04_quotes-management-system/tasks.md
- Technical Specification: (To be created during Phase 1)
- API Specification: (To be created during Phase 1)
- Database Schema: (To be created during Phase 1)
- Tests Specification: (To be created during Phase 1)

---

**This quotes management system will serve as the revenue engine for Clearpoint Technology + Design, leveraging Todd's proven business logic with Volteus's modern infrastructure and professional design system.**
