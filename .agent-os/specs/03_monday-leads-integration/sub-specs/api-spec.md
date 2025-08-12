# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/03_monday-leads-integration/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## API Architecture

### Monday.com Integration Functions
Core integration through `src/lib/monday.ts` library and Next.js API routes for secure server-side operations.

### Authentication
- **Monday.com API Key**: Secure API key authentication
- **Supabase Service Role**: Bypass RLS for sync operations

## Core API Functions

### Monday.com Client (`src/lib/monday.ts`)

#### `fetchContacts()`
**Purpose:** Fetch contacts from Monday.com board via GraphQL API  
**Parameters:** None (uses environment variables)

**Response Format:**
```typescript
{
  success: boolean;
  data?: Contact[];
  error?: string;
}

interface Contact {
  monday_item_id: number;
  first_name: string;
  last_name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  type?: string;
}
```

**GraphQL Query:**
```graphql
query ($boardId: ID!) {
  boards(ids: [$boardId]) {
    items_page {
      items {
        id
        column_values {
          id
          text
        }
      }
    }
  }
}
```

### API Routes

#### `POST /api/monday/contacts/sync`
**Purpose:** Sync contacts from Monday.com to local database  
**Authentication:** Requires valid user session

**Response Format:**
```typescript
{
  success: boolean;
  message?: string;
  stats?: {
    fetched: number;
    synced: number;
    errors: number;
  };
  error?: string;
}
```

**Process Flow:**
1. Validate environment configuration
2. Fetch contacts from Monday.com API
3. Transform data to Volteus schema
4. Upsert contacts to contacts_monday table
5. Return sync statistics

#### `GET /api/monday/contacts/list`
**Purpose:** Retrieve synced contacts from local database  
**Authentication:** Requires valid user session

**Response Format:**
```typescript
{
  success: boolean;
  data?: Contact[];
  total?: number;
  error?: string;
}
```

## Error Handling

### Error Types
- **CONFIGURATION_ERROR** - Missing environment variables
- **API_ERROR** - Monday.com API failures
- **DATABASE_ERROR** - Supabase operation failures
- **AUTHENTICATION_ERROR** - Invalid credentials

### Error Response Format
```typescript
interface APIError {
  success: false;
  error: string;
  details?: {
    code: string;
    message: string;
  };
}
```

## Security Considerations

### API Key Security
- Environment variable storage only
- No client-side exposure
- Service role database access

### Access Control
- Authenticated users only
- RLS policy enforcement
- Service role bypass for sync operations
