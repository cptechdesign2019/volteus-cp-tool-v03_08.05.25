# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/03_monday-leads-integration/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Test Coverage Strategy

### Testing Framework
- **Vitest** for unit and integration tests
- **@testing-library/react** for component testing
- **MSW** for API mocking

### Test Organization
```
__tests__/
├── api/
│   └── monday-integration.test.ts
├── components/
│   └── leads-dashboard.test.tsx
├── lib/
│   └── monday.test.ts
└── integration/
    └── monday-sync-workflow.test.tsx
```

## Unit Tests

### Monday.com Library (`__tests__/lib/monday.test.ts`)
- **Should fetch contacts from Monday.com API**
  - Test GraphQL query construction
  - Test API response parsing
  - Test data transformation
  - Test error handling
- **Should validate environment configuration**
  - Test missing API key handling
  - Test missing board ID handling
  - Test invalid configuration responses
- **Should map Monday.com data correctly**
  - Test column value extraction
  - Test data type conversion
  - Test missing field handling
  - Test schema compliance

### API Routes (`__tests__/api/monday-integration.test.ts`)
- **Should sync contacts successfully**
  - Test complete sync workflow
  - Test upsert functionality
  - Test duplicate handling
  - Test sync statistics
- **Should list synced contacts**
  - Test data retrieval
  - Test filtering and sorting
  - Test empty state handling
  - Test authentication requirements

### Component Tests (`__tests__/components/leads-dashboard.test.tsx`)
- **Should render contact tabs correctly**
  - Test Monday.com tab display
  - Test Volteus native tab display
  - Test tab switching behavior
  - Test empty state handling
- **Should handle sync operations**
  - Test sync button functionality
  - Test loading state display
  - Test error state handling
  - Test success confirmation

## Integration Tests

### Complete Sync Workflow (`__tests__/integration/monday-sync-workflow.test.tsx`)
- **Should perform end-to-end sync**
  1. Mock Monday.com API responses
  2. Trigger sync operation
  3. Verify database updates
  4. Verify UI updates
  5. Verify error handling

## Mocking Requirements

### Monday.com API Mock
```typescript
export const mockMondayAPI = {
  boards: {
    items_page: {
      items: [
        {
          id: '123456',
          column_values: [
            { id: 'text_mkpw4ym4', text: 'John' },
            { id: 'text_mkpwcsbq', text: 'Doe' },
            { id: 'contact_email', text: 'john@example.com' }
          ]
        }
      ]
    }
  }
};
```

### Test Data
```typescript
export const mockContactData = {
  monday_item_id: 123456,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  company: 'Test Company',
  type: 'Commercial',
  last_synced_at: '2025-01-08T10:00:00Z'
};
```

## Coverage Requirements

- **Unit Tests**: 80% coverage for Monday.com integration
- **Component Tests**: 70% coverage for leads dashboard
- **Integration Tests**: Complete sync workflow coverage
- **Error Handling**: All error scenarios tested
