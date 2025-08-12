# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/01_customer-management-system/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## API Architecture

### API Layer Functions
All customer management operations use server-side functions in `src/lib/api/customers.ts` that interface with Supabase client. No traditional REST endpoints required due to Supabase's client-side SDK approach.

### Authentication
- **Supabase Auth**: JWT-based authentication through Supabase client
- **RLS Enforcement**: Database-level security through Row Level Security policies
- **Session Management**: Automatic token refresh and session handling

## API Functions

### Customer Account Management

#### `getCustomers(filters?: CustomerFilters)`
**Purpose:** Retrieve filtered list of customer accounts with primary contact information  
**Parameters:**
- `searchQuery?: string` - Search across company name and contact names
- `customerType?: 'Residential' | 'Commercial' | 'All'` - Filter by customer type
- `dateRange?: { start: string, end: string }` - Filter by creation date
- `limit?: number` - Pagination limit (default: 50)
- `offset?: number` - Pagination offset

**Response Format:**
```typescript
{
  success: boolean;
  data: CustomerWithContact[];
  total: number;
  error?: string;
}

interface CustomerWithContact {
  id: string;
  company_name: string;
  customer_type: 'Residential' | 'Commercial';
  billing_address: Address;
  service_address: Address;
  account_notes?: string;
  tags: string[];
  created_at: string;
  primary_contact?: {
    id: string;
    contact_name: string;
    email?: string;
    phone?: string;
    role?: string;
  };
}
```

**Error Handling:**
- Database connection errors
- Authentication failures
- Invalid filter parameters
- Search query formatting issues

#### `getCustomerById(customerId: string)`
**Purpose:** Retrieve complete customer account details with all contacts  
**Parameters:**
- `customerId: string` - Customer account ID

**Response Format:**
```typescript
{
  success: boolean;
  data?: CustomerAccount;
  contacts?: CustomerContact[];
  error?: string;
}
```

**Error Handling:**
- Customer not found (404)
- Unauthorized access (403)
- Invalid customer ID format

#### `createCustomer(customerData: CreateCustomerData)`
**Purpose:** Create new customer account with primary contact  
**Parameters:**
```typescript
interface CreateCustomerData {
  company_name: string;
  customer_type: 'Residential' | 'Commercial';
  billing_address?: Address;
  service_address?: Address;
  account_notes?: string;
  tags?: string[];
  primary_contact: {
    contact_name: string;
    email?: string;
    phone?: string;
    role?: string;
    contact_notes?: string;
  };
}
```

**Response Format:**
```typescript
{
  success: boolean;
  data?: {
    customer: CustomerAccount;
    primary_contact: CustomerContact;
  };
  error?: string;
}
```

**Error Handling:**
- Validation errors for required fields
- Duplicate company name handling
- Database constraint violations
- Transaction rollback on contact creation failure

#### `updateCustomerAccount(customerId: string, accountData: Partial<CustomerAccount>)`
**Purpose:** Update customer account information  
**Parameters:**
- `customerId: string` - Customer account ID
- `accountData: Partial<CustomerAccount>` - Fields to update

**Response Format:**
```typescript
{
  success: boolean;
  data?: CustomerAccount;
  error?: string;
}
```

**Error Handling:**
- Customer not found
- Validation errors
- Unauthorized modifications
- Optimistic locking conflicts

#### `updateCustomerContact(contactId: string, contactData: Partial<CustomerContact>)`
**Purpose:** Update customer contact information  
**Parameters:**
- `contactId: string` - Contact ID
- `contactData: Partial<CustomerContact>` - Fields to update

**Response Format:**
```typescript
{
  success: boolean;
  data?: CustomerContact;
  error?: string;
}
```

**Error Handling:**
- Contact not found
- Primary contact constraint violations
- Email format validation errors
- Access permission checks

#### `deleteCustomer(customerId: string)`
**Purpose:** Soft delete customer account after validation  
**Parameters:**
- `customerId: string` - Customer account ID

**Response Format:**
```typescript
{
  success: boolean;
  message?: string;
  error?: string;
  dependencies?: {
    active_quotes: number;
    active_projects: number;
  };
}
```

**Error Handling:**
- Customer has active quotes/projects
- Customer not found
- Insufficient permissions
- Foreign key constraint violations

### Customer Statistics

#### `getCustomerStats()`
**Purpose:** Retrieve dashboard statistics for customer overview  
**Parameters:** None

**Response Format:**
```typescript
{
  success: boolean;
  data?: {
    total_customers: number;
    residential_customers: number;
    commercial_customers: number;
    recent_additions: number; // Last 30 days
    customers_with_active_quotes: number;
  };
  error?: string;
}
```

**Error Handling:**
- Database aggregation errors
- Performance timeout issues
- Authentication failures

### CSV Import Operations

#### `validateCustomerCSV(csvData: any[], customerType?: string)`
**Purpose:** Validate CSV data before import  
**Parameters:**
- `csvData: any[]` - Parsed CSV rows
- `customerType?: string` - Override customer type

**Response Format:**
```typescript
{
  success: boolean;
  data?: {
    valid_rows: any[];
    invalid_rows: { row: any; errors: string[] }[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
    };
  };
  error?: string;
}
```

#### `batchCreateCustomers(validatedData: any[], progressCallback?: Function)`
**Purpose:** Bulk create customers from validated CSV data  
**Parameters:**
- `validatedData: any[]` - Pre-validated customer data
- `progressCallback?: Function` - Progress update callback

**Response Format:**
```typescript
{
  success: boolean;
  summary?: {
    created: number;
    failed: number;
    total: number;
    errors: string[];
  };
  error?: string;
}
```

## Error Response Format

### Standard Error Structure
```typescript
interface APIError {
  success: false;
  error: string;
  details?: {
    field?: string;
    code?: string;
    message?: string;
  };
}
```

### Error Codes
- **VALIDATION_ERROR** - Input validation failed
- **NOT_FOUND** - Resource not found
- **UNAUTHORIZED** - Authentication required
- **FORBIDDEN** - Insufficient permissions
- **CONFLICT** - Resource conflict (e.g., duplicate names)
- **DATABASE_ERROR** - Database operation failed
- **NETWORK_ERROR** - Network connectivity issues

## Performance Optimization

### Caching Strategy
- **React Query caching** for customer lists and details
- **Stale-while-revalidate** pattern for dashboard statistics
- **Optimistic updates** for edit operations
- **Background refetch** for real-time data consistency

### Pagination
- **Limit/offset pagination** for customer lists
- **Cursor-based pagination** available for large datasets
- **Virtual scrolling** support for UI performance
- **Efficient counting** with separate count queries

### Rate Limiting
- **Client-side debouncing** for search operations (300ms)
- **Request deduplication** for identical simultaneous requests
- **Batch operations** for bulk updates
- **Progressive loading** for large customer lists

## Data Validation

### Input Validation
```typescript
// Customer account validation
const customerAccountSchema = {
  company_name: { required: true, minLength: 2, maxLength: 100 },
  customer_type: { required: true, enum: ['Residential', 'Commercial'] },
  billing_address: { type: 'object', optional: true },
  service_address: { type: 'object', optional: true },
  account_notes: { maxLength: 1000, optional: true },
  tags: { type: 'array', items: 'string', optional: true }
};

// Contact validation
const contactSchema = {
  contact_name: { required: true, minLength: 2, maxLength: 100 },
  email: { format: 'email', optional: true },
  phone: { format: 'phone', optional: true },
  role: { maxLength: 50, optional: true },
  is_primary_contact: { type: 'boolean', default: false }
};
```

### Data Sanitization
- **HTML entity encoding** for text inputs
- **Phone number standardization** for consistent formatting
- **Email normalization** for case consistency
- **Address formatting** for JSONB storage

## Security Considerations

### Input Security
- **SQL injection prevention** through parameterized queries
- **XSS protection** via React's built-in escaping
- **CSRF protection** through Supabase's built-in mechanisms
- **Input validation** at multiple layers

### Access Control
- **Row Level Security** enforced at database level
- **JWT validation** for all operations
- **Permission checks** before sensitive operations
- **Audit logging** for data modifications

### Data Privacy
- **PII handling** according to privacy regulations
- **Data encryption** in transit and at rest
- **Access logging** for compliance requirements
- **Data retention** policies for customer information
