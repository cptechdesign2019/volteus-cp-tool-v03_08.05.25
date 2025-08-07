# Spec Requirements Document

> Spec: Monday.com CRM Integration  
> Created: 2025-07-31  
> Status: **Completed** (Retrospective)  

## Overview

Implement a direct API integration with Monday.com to sync contact data from the "Contacts" board into Volteus, enabling seamless lead management while maintaining the existing Monday.com workflow during the transition period. This integration provides real-time contact data without disrupting current business processes.

## User Stories

### Data Synchronization
- *As a Sales Rep, I want to see all Monday.com contacts in Volteus so that I have a unified view of our lead pipeline.*
- *As a Business Owner, I want contacts to sync automatically so that data stays current without manual export/import processes.*
- *As a Sales Manager, I want to manually trigger sync updates so that I can refresh data when needed.*

### Workflow Continuity
- *As a Sales Team, I want to continue using Monday.com for data entry so that our existing workflow isn't disrupted during transition.*
- *As a Data Admin, I want to see sync timestamps so that I know when data was last updated.*
- *As a Business Owner, I want separate Monday.com and native lead tables so that we can migrate gradually.*

## Spec Scope

### In Scope
1. **Monday.com API Integration**
   - GraphQL API connection to Monday.com v2
   - Authentication via API key
   - Contact data retrieval from specified board (ID: 8809292768)
   - Column mapping for standard contact fields

2. **Database Schema**
   - `contacts_monday` table for synced data
   - Separate from future `leads_native` table
   - Optimized indexes for email and sync timestamp queries
   - Primary key on `monday_item_id` for upsert operations

3. **Sync Functionality**
   - Manual "Sync Now" button for on-demand updates
   - Upsert logic to handle new and updated contacts
   - Error handling and logging for failed sync operations
   - Sync timestamp tracking for audit purposes

4. **User Interface**
   - Two-tab leads page design (Monday.com / Volteus Native)
   - Professional table layout with contact details
   - Sync status indicators and last sync timestamp
   - Empty state messaging for clarity

### Out of Scope
- **Automated cron jobs** (planned for future iteration)
- **Bidirectional sync** (Monday.com remains source of truth)
- **Contact editing within Volteus** (read-only integration)
- **Contact conversion to native leads** (future feature)

## Technical Implementation

### Database Schema
```sql
CREATE TABLE contacts_monday (
  monday_item_id BIGINT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  type TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Integration
- **Monday.com GraphQL API**: `https://api.monday.com/v2`
- **Authentication**: Bearer token in Authorization header
- **Query Structure**: Board items with column values
- **Column Mappings**:
  - `text_mkpw4ym4` → first_name
  - `text_mkpwcsbq` → last_name
  - `title5` → title
  - `text8` → company
  - `contact_email` → email
  - `contact_phone` → phone
  - `status` → type

### Environment Variables
```bash
MONDAY_API_KEY=your_api_key_here
MONDAY_CONTACTS_BOARD_ID=8809292768
```

## Success Metrics

### Functional Requirements ✅
- [x] Successful API connection to Monday.com
- [x] Contact data retrieval and display
- [x] Manual sync functionality working
- [x] Professional UI matching dashboard design
- [x] Error handling for failed operations

### Technical Requirements ✅
- [x] Database table created with proper schema
- [x] API routes implemented (`/api/contacts/sync`, `/api/contacts/list`)
- [x] GraphQL query optimized for required data
- [x] Upsert logic handling duplicates correctly
- [x] Environment variable configuration

### User Experience ✅
- [x] Intuitive two-tab interface
- [x] Clear sync status and timestamps
- [x] Responsive table design
- [x] Proper empty states
- [x] Consistent branding and styling

## Future Enhancements

1. **Automated Sync Schedule**
   - Daily midnight cron job via Render.com
   - Webhook integration for real-time updates

2. **Advanced Data Management**
   - Contact deduplication logic
   - Data validation and cleanup
   - Export functionality

3. **Migration Tools**
   - Contact conversion to native leads
   - Bulk import/export capabilities
   - Data migration assistance

## Dependencies

- **Foundation & Security Spec**: Database access, authentication system
- **Monday.com Account**: API access and board permissions
- **Supabase**: Database hosting and service role access

## Risk Mitigation

- **API Rate Limits**: Implemented proper error handling and retry logic
- **Data Consistency**: Read-only integration prevents data corruption
- **Performance**: Indexed database queries for fast data retrieval
- **Security**: Environment variables for credential management