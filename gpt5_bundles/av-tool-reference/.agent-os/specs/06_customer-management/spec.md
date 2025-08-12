# Spec Requirements Document

> Spec: Customer Account Management System
> Created: 2025-01-01
> Status: Ready for Implementation

## Overview

This spec outlines the creation of a comprehensive customer account management system that serves as the foundation for quote and project management. The system will provide a professional interface for managing customer accounts with their associated contacts, support CSV import for existing customer data, and establish the data relationships needed for future quote creation workflows.

## User Stories

### Primary User Stories
- As a user, I want to view summary statistics about my customer base (residential vs commercial counts, recent additions) so I can understand my business composition at a glance.
- As a user, I want to search and filter customers without auto-loading all data so the page performs well with large customer databases.
- As a user, I want to click on any customer row to see comprehensive account details in a sidebar so I can quickly review all related information.
- As a user, I want to add, edit, and delete customer accounts with proper validation so I can maintain accurate customer records.
- As a user, I want to import customer data from CSV files so I can migrate existing customer databases efficiently.

### Business Logic Stories
- As a user, I want to be warned before deleting any customer account so I don't accidentally lose important records.
- As a user, I want to be prevented from deleting customers with active quotes or projects so I don't lose financial tracking information.
- As a user, I want to manage multiple contacts per customer account so I can maintain relationships with different people at the same company.

## Spec Scope

### 1. Database Schema & Data Model
- **Customer Accounts Table**: Core account information (company name, type, billing address, account metadata)
- **Customer Contacts Table**: Individual contact records linked to customer accounts (name, phone, email, role, primary contact flag)
- **Database relationships**: One-to-many relationship from accounts to contacts
- **Indexes**: Optimized for search by company name, contact name, customer type, and date ranges

### 2. Customer Stats Dashboard
- **Summary Cards**: Display key metrics in card layout at page top
  - Residential customer count
  - Commercial customer count  
  - Total customer count
  - Recent additions (last 30 days)
  - Customers with outstanding items
- **Real-time Updates**: Stats refresh when customer data changes

### 3. Customer Search & Filtering System
- **Conditional Loading**: No customer data loads until search/filter applied
- **Search Functionality**: Search across customer account names and contact names
- **Filter Options**: 
  - Customer type (All, Residential, Commercial)
  - Date added ranges
  - Customers with active quotes/projects
- **Debounced Search**: Optimize performance with delayed API calls

### 4. Customer Data Table
- **Minimal Column Display**: Customer Name, Primary Contact, Phone, Email, Billing Address, Date Added, Actions
- **Clickable Rows**: Entire row clickable to open sidebar drawer
- **Responsive Design**: Table adapts to different screen sizes
- **Loading States**: Skeleton loading during data fetch
- **Empty States**: Professional messaging when no results found

### 5. Customer Details Sidebar
- **Slide Animation**: Drawer slides from right when customer row clicked
- **Comprehensive Information Display**:
  - Customer account details (company name, type, billing/service addresses)
  - Primary contact information
  - Additional contacts list with roles
  - Account metadata (date added, notes, tags)
  - Related quotes summary (titles, dates, statuses)
  - Related projects summary (titles, dates, statuses)
  - Invoice history overview
  - Outstanding items/follow-ups
- **Quick Actions**: Edit account, add contact, create quote buttons

### 6. Customer Account Management
- **Add Customer Modal**: 
  - Account information form
  - Primary contact form
  - Customer type selection
  - Address management (billing/service)
  - Form validation and error handling
- **Edit Customer Modal**:
  - Edit all account and primary contact information
  - Manage additional contacts
  - Update addresses and metadata
  - Optimistic updates with rollback capability
- **Delete Customer Protection**:
  - Check for active quotes/projects before deletion
  - Warning dialog showing what will be affected
  - Confirmation with typed account name for safety

### 7. CSV Import System
- **Dual Import Support**: Handle both residential and commercial CSV files
- **Import Preview**: Show data preview with validation results
- **Data Mapping**: Map CSV columns to database fields
- **Duplicate Handling**: Detect and resolve duplicate customer accounts
- **Error Reporting**: Detailed feedback on import issues
- **Batch Processing**: Handle large CSV files efficiently

### 8. API Layer & Data Management
- **CRUD Operations**: Full create, read, update, delete for customers and contacts
- **Search API**: Optimized endpoints for filtering and searching
- **Stats API**: Real-time customer statistics calculation
- **Import API**: CSV processing and validation endpoints
- **Relationship Queries**: Efficient loading of related quotes/projects data

## Technical Requirements

### Database Schema
```sql
-- Customer Accounts (Main entity)
CREATE TABLE customer_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('Residential', 'Commercial')),
  billing_address JSONB,
  service_address JSONB,
  account_notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Customer Contacts (Multiple per account)
CREATE TABLE customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_account_id UUID REFERENCES customer_accounts(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(100),
  is_primary_contact BOOLEAN DEFAULT FALSE,
  contact_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Performance Considerations
- **Indexed Fields**: company_name, customer_type, created_at, contact_name, email
- **Pagination**: Support for large customer databases
- **Caching Strategy**: React Query for frequently accessed customer data
- **Optimistic Updates**: Immediate UI feedback with rollback capability

### Integration Points
- **Quotes System**: Customer data structure ready for quote creation
- **Projects System**: Account relationships prepared for project management
- **Authentication**: All operations tied to user permissions
- **Audit Trail**: Track all customer data changes

## Out of Scope

### Current Release Exclusions
- Advanced CRM features (lead scoring, sales pipeline)
- Integration with external accounting systems
- Advanced reporting and analytics
- Customer portal or self-service features
- Automated marketing or communication tools
- Complex contact hierarchy management
- Custom field definitions
- Advanced duplicate detection algorithms

### Future Enhancement Considerations
- Integration with quote creation workflow
- Customer communication history
- Advanced search with custom filters
- Customer relationship mapping
- Integration with accounting software
- Mobile-optimized customer management

## Success Criteria

### Functional Requirements
1. **Customer Discovery**: Users can efficiently find customers through search and filtering without performance issues
2. **Data Completeness**: All customer account information is accessible through the sidebar interface
3. **Data Integrity**: Customer deletion is properly protected when active business relationships exist
4. **Import Efficiency**: CSV import processes both customer files without data loss or corruption
5. **User Experience**: Professional interface matches the design aesthetic of the existing application

### Performance Requirements
1. **Page Load**: Initial page load under 2 seconds
2. **Search Response**: Search results return within 500ms
3. **Sidebar Animation**: Smooth drawer animation without lag
4. **Import Processing**: CSV files up to 1000 customers process within 30 seconds
5. **Stats Calculation**: Customer statistics update within 100ms

### Business Requirements
1. **Data Migration**: Successful import of existing residential and commercial customer databases
2. **Workflow Foundation**: Customer data structure supports future quote and project creation
3. **Business Protection**: Financial data integrity maintained through deletion protection
4. **Scalability**: System handles growth to thousands of customer accounts
5. **User Adoption**: Interface intuitive enough for immediate team adoption

## Implementation Notes

### Development Approach
- **Database First**: Establish schema and relationships before UI development
- **Component Reuse**: Leverage existing UI patterns from Product Library where applicable
- **Progressive Enhancement**: Build core functionality first, then add advanced features
- **Testing Strategy**: Unit tests for business logic, integration tests for workflows

### Risk Mitigation
- **Data Loss Prevention**: Multiple confirmation steps for destructive actions
- **Performance Monitoring**: Track query performance as customer database grows
- **Migration Safety**: Backup existing data before CSV import operations
- **User Training**: Provide clear guidance for customer management workflows