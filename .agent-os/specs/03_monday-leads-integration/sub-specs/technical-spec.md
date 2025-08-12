# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/03_monday-leads-integration/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Technical Requirements

### API Integration Requirements
- **Monday.com GraphQL API v2**: Direct connection with secure authentication
- **API Key Management**: Secure storage and validation of Monday.com credentials
- **Board Data Retrieval**: Fetch specific contact board data with column mapping
- **Error Handling**: Comprehensive API error detection and user-friendly messaging
- **Rate Limiting**: Respect Monday.com API rate limits and implement backoff

### Database Requirements
- **Local Data Storage**: `contacts_monday` table for synchronized contact data
- **Data Persistence**: Maintain contact data locally for offline access and performance
- **Sync Timestamps**: Track when each contact was last synchronized
- **Upsert Strategy**: Update existing contacts, add new ones, handle deletions
- **Performance Indexing**: Optimized queries for contact retrieval and search

### UI/UX Specifications
- **Dual-Tab Interface**: Separate Monday.com and Volteus Native contact sections
- **Professional Table**: Clean, organized display of contact information
- **Manual Sync Control**: User-initiated sync with clear status feedback
- **Loading States**: Visual feedback during sync operations
- **Error Display**: Clear error messages with actionable resolution steps
- **Empty States**: Professional messaging when no data exists

### Integration Requirements
- **Environment Configuration**: Secure environment variable management
- **Service Role Access**: Bypass RLS for API operations using Supabase service role
- **Column Mapping**: Map Monday.com column IDs to Volteus data schema
- **Data Validation**: Ensure data integrity during sync operations
- **Conflict Resolution**: Handle data conflicts and sync failures gracefully

### Performance Criteria
- **Sync Speed**: Complete contact sync within 10 seconds for typical datasets
- **API Response**: Monday.com API calls complete within 5 seconds
- **Database Operations**: Local data queries respond within 500ms
- **UI Responsiveness**: Interface remains responsive during sync operations
- **Memory Management**: Efficient handling of contact data without memory leaks

## Approach Options

**Option A: Local Storage with Periodic Sync** (Selected)
- Pros: Fast local access, offline capability, reduced API calls, better performance
- Cons: Data can become stale, sync complexity, storage overhead
- Performance: Excellent for day-to-day operations

**Option B: Real-time API Calls**
- Pros: Always current data, no storage overhead, simpler architecture
- Cons: Slow user experience, API rate limiting issues, requires internet
- Performance: Poor user experience, dependent on API availability

**Option C: Webhook-based Real-time Sync**
- Pros: Always current data, efficient updates, excellent user experience
- Cons: Complex webhook setup, requires external URL, Monday.com webhook limitations
- Performance: Excellent when working, complex setup

**Rationale:** Option A provides the best balance of performance and reliability while maintaining data freshness through user-controlled sync operations.

## External Dependencies

- **@monday/api** - Monday.com GraphQL client (not used, using direct fetch)
  - Justification: Direct fetch provides more control and fewer dependencies
- **Monday.com GraphQL API v2** - External API service
  - Justification: Essential for accessing existing Monday.com contact data
- **Supabase Service Role** - Enhanced database access
  - Justification: Required to bypass RLS for API-driven operations

## Component Architecture

### Page Structure
```
leads/page.tsx (Server Component)
├── leads-dashboard.tsx (Client Component)
│   ├── monday-contacts-tab.tsx
│   ├── volteus-contacts-tab.tsx
│   ├── sync-controls.tsx
│   └── contact-table.tsx
```

### API Layer
```
lib/monday.ts
├── fetchContacts() - GraphQL query to Monday.com
├── mapMondayData() - Convert Monday.com format to Volteus schema
├── validateApiCredentials() - Check API key and board access
└── buildGraphQLQuery() - Construct Monday.com GraphQL queries

app/api/monday/contacts/
├── sync/route.ts - Sync endpoint for importing Monday.com data
└── list/route.ts - List endpoint for retrieving stored data
```

### Database Integration
```
supabase/migrations/003_contacts_monday.sql
├── contacts_monday table creation
├── RLS policies for security
├── Indexes for performance
└── Service role permissions
```

## Monday.com API Integration

### GraphQL Query Structure
```graphql
query ($boardId: ID!) {
  boards(ids: [$boardId]) {
    items_page {
      items {
        id
        name
        column_values {
          id
          text
          value
        }
      }
    }
  }
}
```

### Column Mapping System
```typescript
const COLUMN_MAPPING = {
  first_name: 'text_mkpw4ym4',    // Monday.com column ID
  last_name: 'text_mkpwcsbq',     // Monday.com column ID
  title: 'title5',                // Monday.com column ID
  company: 'text8',               // Monday.com column ID
  email: 'contact_email',         // Monday.com column ID
  phone: 'contact_phone',         // Monday.com column ID
  type: 'status'                  // Monday.com column ID
};
```

### Data Transformation Logic
```typescript
function mapMondayContactToVolteus(mondayItem: MondayItem): Contact {
  const columnValues = mondayItem.column_values.reduce((acc, col) => {
    acc[col.id] = col.text || col.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    monday_item_id: parseInt(mondayItem.id),
    first_name: columnValues[COLUMN_MAPPING.first_name] || '',
    last_name: columnValues[COLUMN_MAPPING.last_name] || '',
    title: columnValues[COLUMN_MAPPING.title] || null,
    company: columnValues[COLUMN_MAPPING.company] || null,
    email: columnValues[COLUMN_MAPPING.email] || null,
    phone: columnValues[COLUMN_MAPPING.phone] || null,
    type: columnValues[COLUMN_MAPPING.type] || null,
    last_synced_at: new Date().toISOString()
  };
}
```

## Database Schema Integration

### Contact Storage Table
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
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Performance Optimization
- **Primary Key**: monday_item_id for efficient upserts
- **Search Index**: GIN index on combined name fields for search
- **Email Index**: B-tree index for email lookups
- **Sync Index**: Index on last_synced_at for recent contact queries

### RLS Security Model
```sql
-- Read access for authenticated users
CREATE POLICY "Authenticated users can view Monday contacts" ON contacts_monday
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Service role has full access for sync operations
CREATE POLICY "Service role can manage all Monday contacts" ON contacts_monday
  FOR ALL TO service_role USING (true);
```

## Error Handling Strategy

### API Error Categories
- **Authentication Errors**: Invalid API key, expired tokens
- **Authorization Errors**: Insufficient permissions, board access denied
- **Network Errors**: Connection timeouts, DNS resolution failures
- **Rate Limiting**: API quota exceeded, request throttling
- **Data Errors**: Invalid board ID, missing columns, malformed responses

### Error Response Mapping
```typescript
function mapMondayError(error: any): UserFriendlyError {
  if (error.message?.includes('Invalid API key')) {
    return {
      type: 'authentication',
      message: 'Monday.com API key is invalid. Please check your credentials.',
      actionable: 'Verify API key in environment variables'
    };
  }
  
  if (error.message?.includes('Board not found')) {
    return {
      type: 'configuration',
      message: 'Monday.com board not accessible. Please check board ID.',
      actionable: 'Verify MONDAY_CONTACTS_BOARD_ID in environment'
    };
  }
  
  return {
    type: 'unknown',
    message: 'An unexpected error occurred during sync.',
    actionable: 'Try again or contact support if problem persists'
  };
}
```

### Recovery Mechanisms
- **Automatic Retry**: Exponential backoff for transient failures
- **Partial Sync**: Continue processing remaining contacts if some fail
- **Error Logging**: Detailed error logging for debugging
- **User Feedback**: Clear error messages with resolution steps

## Security Considerations

### API Key Security
- **Environment Variables**: Store API keys securely in .env.local
- **Runtime Validation**: Validate API key format and permissions
- **No Client Exposure**: API keys never sent to client-side code
- **Rotation Support**: Easy API key rotation without code changes

### Data Privacy
- **Contact Data Protection**: Secure handling of personal contact information
- **Transmission Security**: HTTPS encryption for all API communications
- **Storage Security**: Encrypted database storage with Supabase
- **Access Control**: Proper authentication required for all operations

### Network Security
- **API Endpoint Validation**: Verify Monday.com API endpoints
- **Request Signing**: Use proper authentication headers
- **Response Validation**: Validate all API responses before processing
- **Error Information**: Sanitize error messages to prevent information leakage

## Performance Optimization

### Sync Performance
- **Batch Processing**: Process contacts in optimal batches
- **Incremental Sync**: Only sync changed data (future enhancement)
- **Connection Pooling**: Reuse database connections efficiently
- **Memory Management**: Clean up resources after sync operations

### Database Performance
- **Upsert Strategy**: Efficient ON CONFLICT handling for duplicates
- **Index Usage**: Leverage indexes for fast contact lookups
- **Query Optimization**: Minimize database round trips
- **Connection Management**: Proper connection lifecycle management

### UI Performance
- **Loading States**: Responsive UI during sync operations
- **Progressive Loading**: Stream contact data as it becomes available
- **Debounced Actions**: Prevent multiple simultaneous sync operations
- **Memory Cleanup**: Proper component cleanup and memory management

## Testing Strategy

### API Integration Tests
- Monday.com API connectivity and authentication
- GraphQL query construction and execution
- Error handling for various failure scenarios
- Data transformation and mapping accuracy

### Database Integration Tests
- Contact upsert operations with conflict resolution
- RLS policy enforcement and service role access
- Index performance with large datasets
- Data integrity and constraint validation

### UI Integration Tests
- Sync button functionality and state management
- Table display and data formatting
- Error message display and user feedback
- Tab navigation and component interaction

### End-to-End Tests
- Complete sync workflow from API to UI
- Error recovery and user experience
- Performance with realistic data volumes
- Cross-browser compatibility and mobile responsiveness

## Environment Configuration

### Required Environment Variables
```bash
# Monday.com API Integration
MONDAY_API_KEY=your_monday_api_key_here
MONDAY_CONTACTS_BOARD_ID=your_board_id_here

# Supabase Service Role (for bypassing RLS)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Configuration Validation
```typescript
function validateEnvironmentConfig(): ValidationResult {
  const errors: string[] = [];
  
  if (!process.env.MONDAY_API_KEY) {
    errors.push('MONDAY_API_KEY is required');
  }
  
  if (!process.env.MONDAY_CONTACTS_BOARD_ID) {
    errors.push('MONDAY_CONTACTS_BOARD_ID is required');
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### Setup Documentation
1. **Generate Monday.com API Token**: From user profile settings
2. **Identify Board ID**: From Monday.com board URL
3. **Configure Environment**: Add variables to .env.local
4. **Run Database Migration**: Execute contacts_monday table creation
5. **Test Configuration**: Verify API connection and permissions
