# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/01_customer-management-system/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Test Coverage Strategy

### Testing Framework
- **Vitest** for unit and integration tests
- **@testing-library/react** for component testing
- **jsdom** for DOM simulation
- **MSW (Mock Service Worker)** for API mocking

### Test Organization
```
__tests__/
├── api/
│   └── customers.test.ts
├── components/
│   ├── customer-dashboard.test.tsx
│   ├── customer-search-bar.test.tsx
│   ├── customer-table.test.tsx
│   ├── add-customer-modal.test.tsx
│   └── edit-customer-modal.test.tsx
├── utils/
│   └── customer-validation.test.ts
└── integration/
    └── customer-workflow.test.tsx
```

## Unit Tests

### Customer API Functions (`__tests__/api/customers.test.ts`)

#### `getCustomers()` Tests
- **Should return filtered customers by search query**
  - Test search across company names
  - Test search across contact names  
  - Test case-insensitive search
  - Test special character handling
- **Should filter customers by type**
  - Test 'Residential' filter
  - Test 'Commercial' filter
  - Test 'All' filter behavior
- **Should handle pagination correctly**
  - Test limit and offset parameters
  - Test total count accuracy
  - Test empty result sets
- **Should handle authentication errors**
  - Test unauthenticated requests
  - Test expired tokens
  - Test insufficient permissions

#### `createCustomer()` Tests
- **Should create customer with valid data**
  - Test minimal required fields
  - Test complete customer data
  - Test primary contact creation
  - Test audit field population
- **Should validate required fields**
  - Test missing company_name
  - Test invalid customer_type
  - Test missing primary contact
- **Should handle duplicate company names**
  - Test duplicate detection
  - Test error message clarity
  - Test suggestion for resolution
- **Should rollback on contact creation failure**
  - Test transaction integrity
  - Test partial failure handling
  - Test error propagation

#### `updateCustomerAccount()` Tests
- **Should update account fields correctly**
  - Test partial updates
  - Test complete field replacement
  - Test JSONB address updates
  - Test tags array manipulation
- **Should validate permissions**
  - Test owner permissions
  - Test unauthorized access attempts
  - Test cross-tenant data isolation
- **Should handle optimistic locking**
  - Test concurrent update detection
  - Test conflict resolution
  - Test version mismatch handling

#### `deleteCustomer()` Tests
- **Should prevent deletion with dependencies**
  - Test active quotes blocking
  - Test active projects blocking
  - Test dependency count accuracy
- **Should perform soft deletion**
  - Test account archival
  - Test contact preservation
  - Test audit trail maintenance
- **Should validate permissions**
  - Test ownership verification
  - Test admin override capabilities
  - Test unauthorized deletion attempts

### Component Tests

#### `CustomerDashboard` Component
- **Should render statistics cards correctly**
  - Test customer count display
  - Test residential/commercial breakdown
  - Test recent additions calculation
  - Test loading states
- **Should handle search interactions**
  - Test search input functionality
  - Test filter dropdown behavior
  - Test search result updates
  - Test empty state display
- **Should manage modal states**
  - Test add customer modal opening
  - Test CSV import modal opening
  - Test modal closing behavior
  - Test form reset on close

#### `CustomerSearchBar` Component
- **Should implement debounced search**
  - Test 300ms delay behavior
  - Test rapid typing handling
  - Test search cancellation
  - Test persistent focus maintenance
- **Should handle filter selections**
  - Test customer type filtering
  - Test filter combination logic
  - Test filter reset functionality
  - Test URL parameter sync
- **Should maintain search state**
  - Test value persistence
  - Test cursor position retention
  - Test selection preservation
  - Test focus management

#### `CustomerTable` Component
- **Should display customer data correctly**
  - Test column rendering
  - Test data formatting
  - Test empty state handling
  - Test loading skeleton display
- **Should handle row interactions**
  - Test row click behavior
  - Test sidebar opening
  - Test keyboard navigation
  - Test selection states
- **Should implement responsive design**
  - Test mobile layout
  - Test column hiding
  - Test horizontal scroll
  - Test touch interactions

#### `AddCustomerModal` Component
- **Should validate form inputs**
  - Test required field validation
  - Test email format validation
  - Test phone number formatting
  - Test real-time error display
- **Should handle form submission**
  - Test successful creation flow
  - Test error handling
  - Test loading states
  - Test form reset after success
- **Should manage form state**
  - Test field value tracking
  - Test dirty state detection
  - Test unsaved changes warning
  - Test form persistence

#### `EditCustomerModal` Component
- **Should populate existing data**
  - Test form field pre-population
  - Test nested object handling
  - Test array field management
  - Test contact data loading
- **Should handle partial updates**
  - Test field-level changes
  - Test unchanged field preservation
  - Test optimistic updates
  - Test rollback on error
- **Should validate permissions**
  - Test edit permission checks
  - Test read-only field enforcement
  - Test unauthorized access handling
  - Test field-level permissions

## Integration Tests

### Customer Workflow (`__tests__/integration/customer-workflow.test.tsx`)

#### Complete Customer Lifecycle
- **Should create new customer end-to-end**
  1. Open add customer modal
  2. Fill required information
  3. Submit form and verify creation
  4. Verify dashboard statistics update
  5. Verify customer appears in search results
- **Should edit existing customer**
  1. Search for specific customer
  2. Open customer details sidebar
  3. Open edit modal from sidebar
  4. Modify customer information
  5. Save changes and verify updates
- **Should handle CSV import workflow**
  1. Open CSV import modal
  2. Upload sample CSV file
  3. Review parsed data preview
  4. Confirm import operation
  5. Verify customers created successfully

#### Search and Filter Integration
- **Should combine search and filters effectively**
  1. Apply customer type filter
  2. Enter search query
  3. Verify combined results
  4. Clear filters and verify reset
  5. Test filter persistence across navigation

#### Error Handling Integration
- **Should handle network failures gracefully**
  1. Simulate network disconnection
  2. Attempt customer operations
  3. Verify error messages display
  4. Test retry mechanisms
  5. Verify data consistency after reconnection

## Mocking Requirements

### Supabase Client Mock
```typescript
// Mock Supabase client for testing
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
  },
};
```

### CSV Parser Mock
```typescript
// Mock Papa Parse for CSV testing
export const mockPapaparse = {
  parse: jest.fn((file, options) => {
    if (options.complete) {
      options.complete({
        data: mockCsvData,
        errors: [],
        meta: { fields: mockHeaders }
      });
    }
  })
};
```

### API Response Mocks
```typescript
// Standard customer data for testing
export const mockCustomerData = {
  id: 'cust_123',
  company_name: 'Test Company',
  customer_type: 'Commercial',
  billing_address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345'
  },
  created_at: '2025-01-08T10:00:00Z',
  primary_contact: {
    id: 'contact_456',
    contact_name: 'John Doe',
    email: 'john@testcompany.com',
    phone: '555-0123'
  }
};
```

## Performance Tests

### Load Testing Scenarios
- **Large customer dataset handling (1000+ records)**
  - Test search performance with large datasets
  - Test pagination efficiency
  - Test memory usage during scrolling
  - Test component rendering performance
- **Concurrent user operations**
  - Test simultaneous customer edits
  - Test search result consistency
  - Test optimistic update conflicts
  - Test real-time data synchronization

### Memory Leak Detection
- **Component cleanup verification**
  - Test event listener removal
  - Test timer cleanup
  - Test subscription cancellation
  - Test reference cleanup
- **Long-running session testing**
  - Test extended search sessions
  - Test modal open/close cycles
  - Test data refresh operations
  - Test garbage collection effectiveness

## Test Data Management

### Test Database Setup
```sql
-- Test data for customer management testing
INSERT INTO customer_accounts (company_name, customer_type, created_by) VALUES
('Test Residential Customer', 'Residential', auth.uid()),
('Test Commercial Customer', 'Commercial', auth.uid()),
('Search Test Company', 'Commercial', auth.uid());

INSERT INTO customer_contacts (customer_account_id, contact_name, email, is_primary_contact) VALUES
(1, 'Jane Smith', 'jane@residential.com', true),
(2, 'Bob Johnson', 'bob@commercial.com', true),
(3, 'Alice Brown', 'alice@search.com', true);
```

### CSV Test Data
```csv
Company Name,Customer Type,Contact Name,Email,Phone,Street,City,State,ZIP
"Test Import Co","Commercial","Import Contact","import@test.com","555-0100","456 Import St","Import City","IC","54321"
"Residential Test","Residential","Home Owner","owner@home.com","555-0200","789 Home Ave","Home Town","HT","67890"
```

## Continuous Integration

### Test Automation
- **Pre-commit hooks** for running unit tests
- **Pull request validation** with full test suite
- **Nightly integration tests** with real database
- **Performance regression testing** on significant changes

### Coverage Requirements
- **Unit test coverage**: Minimum 80% for API functions
- **Component test coverage**: Minimum 70% for UI components
- **Integration test coverage**: All critical user workflows
- **E2E test coverage**: Complete customer lifecycle scenarios

### Test Reporting
- **Coverage reports** integrated with CI/CD
- **Performance metrics** tracked over time
- **Flaky test detection** and automatic retry
- **Test result notifications** for team awareness
