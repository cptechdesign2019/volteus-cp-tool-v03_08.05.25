# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-04-api-security-foundation/spec.md

> Created: 2025-08-04
> Version: 1.0.0

## Overview

This specification defines the security patterns and requirements for securing Todd's AV Management API endpoints within Volteus's multi-tenant architecture. All endpoints will be wrapped with authentication, authorization, audit logging, and rate limiting middleware.

## Security Middleware Pattern

### Standard Secured Endpoint Structure
```typescript
export const [METHOD] = withPermissions([REQUIRED_PERMISSIONS], async (request, { user, supabase }) => {
  try {
    // 1. Input validation
    // 2. Business logic execution (Todd's existing functions)
    // 3. Audit logging
    // 4. Response formatting
  } catch (error) {
    // 5. Error handling and logging
  }
})
```

### Authentication Context
All secured endpoints receive:
- **user**: AuthenticatedUser object with id, email, role, tenant_id, full_name
- **supabase**: Authenticated Supabase client with user context
- **request**: NextRequest object with headers, body, and query parameters

## Todd API Endpoints to Secure

### Product Management Endpoints

#### GET /api/products
**Purpose**: Retrieve product catalog for current tenant  
**Permissions**: `['products:read']`  
**Parameters**: 
- Query: `category?` (string) - Filter by product category
- Query: `search?` (string) - Search products by name/description
**Response**: 
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "category": "AV Equipment",
      "price": 299.99,
      "description": "Product description"
    }
  ]
}
```
**Audit Action**: `product_list`
**Errors**: 401 (not authenticated), 403 (no products:read permission)

#### POST /api/products
**Purpose**: Create new product in catalog  
**Permissions**: `['products:create']`  
**Parameters**: 
```json
{
  "name": "string (required)",
  "category": "string (required)",
  "price": "number (required)",
  "description": "string (optional)",
  "vendor": "string (optional)"
}
```
**Response**: 
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Product Name",
    "created_at": "2025-08-04T12:00:00Z"
  }
}
```
**Audit Action**: `product_create`
**Errors**: 400 (validation), 401 (not authenticated), 403 (no products:create permission)

#### PUT /api/products/[id]
**Purpose**: Update existing product  
**Permissions**: `['products:update']`  
**Parameters**: Same as POST, all fields optional
**Response**: Updated product object
**Audit Action**: `product_update`

#### DELETE /api/products/[id]
**Purpose**: Delete product from catalog  
**Permissions**: `['products:delete']`  
**Response**: `{ "success": true, "message": "Product deleted" }`
**Audit Action**: `product_delete`

### Customer Management Endpoints

#### GET /api/customers
**Purpose**: Retrieve customer list for current tenant  
**Permissions**: `['customers:read']`  
**Parameters**: 
- Query: `type?` (commercial|residential) - Filter by customer type
- Query: `search?` (string) - Search customers by name/company
**Response**: Customer list with contact information
**Audit Action**: `customer_list`

#### POST /api/customers
**Purpose**: Create new customer account  
**Permissions**: `['customers:create']`  
**Parameters**: Customer account and primary contact information
**Response**: Created customer object with contacts
**Audit Action**: `customer_create`

#### PUT /api/customers/[id]
**Purpose**: Update customer information  
**Permissions**: `['customers:update']`  
**Response**: Updated customer object
**Audit Action**: `customer_update`

#### DELETE /api/customers/[id]
**Purpose**: Delete customer (with protection checks)  
**Permissions**: `['customers:delete']`  
**Response**: Success or error with dependency information
**Audit Action**: `customer_delete`

### Customer Contacts Endpoints

#### GET /api/customers/[customerId]/contacts
**Purpose**: Retrieve contacts for specific customer  
**Permissions**: `['customers:read']`  
**Response**: Contact list for customer
**Audit Action**: `customer_contacts_list`

#### POST /api/customers/[customerId]/contacts
**Purpose**: Add new contact to customer  
**Permissions**: `['customers:update']`  
**Response**: Created contact object
**Audit Action**: `customer_contact_create`

### Quote Management Endpoints

#### GET /api/quotes
**Purpose**: Retrieve quote list for current tenant  
**Permissions**: `['quotes:read']`  
**Parameters**: 
- Query: `status?` (draft|sent|accepted|expired) - Filter by quote status
- Query: `customer?` (uuid) - Filter by customer ID
**Response**: Quote list with summary information
**Audit Action**: `quote_list`

#### POST /api/quotes
**Purpose**: Create new quote  
**Permissions**: `['quotes:create']`  
**Parameters**: Quote header information and line items
**Response**: Created quote object with generated quote number
**Audit Action**: `quote_create`

#### PUT /api/quotes/[id]
**Purpose**: Update existing quote  
**Permissions**: `['quotes:update']`  
**Response**: Updated quote object
**Audit Action**: `quote_update`

#### POST /api/quotes/[id]/duplicate
**Purpose**: Create copy of existing quote  
**Permissions**: `['quotes:create']`  
**Response**: New quote object based on original
**Audit Action**: `quote_duplicate`

### Project Management Endpoints

#### GET /api/projects
**Purpose**: Retrieve project list for current tenant  
**Permissions**: `['projects:read']`  
**Parameters**: 
- Query: `status?` (planning|in_progress|completed) - Filter by project status
- Query: `assigned_to?` (uuid) - Filter by assigned technician
**Response**: Project list with status information
**Audit Action**: `project_list`

#### POST /api/projects
**Purpose**: Create new project from quote  
**Permissions**: `['projects:create']`  
**Parameters**: Quote ID and project initialization data
**Response**: Created project object
**Audit Action**: `project_create`

#### PUT /api/projects/[id]
**Purpose**: Update project status and information  
**Permissions**: `['projects:update']`  
**Response**: Updated project object
**Audit Action**: `project_update`

### Reporting Endpoints

#### GET /api/reports/sales-summary
**Purpose**: Generate sales performance report  
**Permissions**: `['reports:read']`  
**Parameters**: 
- Query: `start_date` (ISO date) - Report start date
- Query: `end_date` (ISO date) - Report end date
**Response**: Sales metrics and summary data
**Audit Action**: `report_sales_summary`

#### GET /api/reports/project-status
**Purpose**: Generate project status report  
**Permissions**: `['reports:read']`  
**Response**: Project status breakdown and metrics
**Audit Action**: `report_project_status`

#### GET /api/reports/export/[reportType]
**Purpose**: Export report data as CSV/Excel  
**Permissions**: `['reports:export']`  
**Response**: File download or download URL
**Audit Action**: `report_export`

## Security Response Patterns

### Success Response
```json
{
  "success": true,
  "data": {}, // or []
  "message": "Optional success message"
}
```

### Authentication Error (401)
```json
{
  "error": "Authentication required",
  "code": "AUTHENTICATION_REQUIRED"
}
```

### Permission Error (403)
```json
{
  "error": "Insufficient permissions",
  "code": "INSUFFICIENT_PERMISSIONS",
  "required_permissions": ["permission:name"]
}
```

### Rate Limit Error (429)
```json
{
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "field_name": ["Error message"]
  }
}
```

### Server Error (500)
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## Audit Logging Requirements

### Audit Event Structure
```typescript
await logAuditEvent(
  user.id,                    // User performing action
  'action_name',              // Action type (product_create, customer_update, etc.)
  'resource_type',            // Resource affected (products, customers, quotes, etc.)
  resource_id,                // Specific resource ID (or null for list operations)
  {                          // Additional context
    key: 'value',
    count: 10,
    changes: { field: 'new_value' }
  },
  getClientIP(request)        // Client IP address
)
```

### Required Audit Actions
- **CRUD Operations**: `{resource}_create`, `{resource}_update`, `{resource}_delete`
- **List Operations**: `{resource}_list` (with count in details)
- **Business Operations**: `quote_duplicate`, `project_create_from_quote`
- **Export Operations**: `report_export`, `data_export`

## Rate Limiting Strategy

### Applied Limits
- **Standard Endpoints**: Use existing Volteus rate limiting (per client IP)
- **Export Endpoints**: Additional rate limiting for resource-intensive operations
- **Bulk Operations**: Enhanced limits for operations that affect multiple records

### Rate Limit Headers
All responses include rate limiting headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1672531200
```

## Error Handling Requirements

### Consistent Error Logging
```typescript
catch (error) {
  console.error(`[${action_name}] Error:`, error)
  await logAuditEvent(user.id, `${action_name}_error`, resource_type, resource_id, {
    error: error.message,
    stack: error.stack
  })
  return NextResponse.json(
    { error: 'Operation failed', code: 'OPERATION_ERROR' },
    { status: 500 }
  )
}
```

### Error Response Standards
- **Never expose internal details** in error messages
- **Always log full error details** for debugging
- **Provide actionable error messages** when possible
- **Include error codes** for programmatic handling
- **Maintain consistent response structure**

## Testing Requirements

### Security Test Coverage
- **Authentication Tests**: Verify all endpoints require authentication
- **Authorization Tests**: Test permission requirements for each endpoint
- **Rate Limiting Tests**: Verify rate limits are enforced
- **Audit Logging Tests**: Ensure all operations generate audit logs
- **Error Handling Tests**: Test all error scenarios and response formats

### Mock Requirements
- **User Authentication**: Mock different user roles and permissions
- **API Responses**: Mock Todd's business logic responses
- **Database Operations**: Mock Supabase operations and audit logging
- **Rate Limiting**: Mock rate limit scenarios and edge cases