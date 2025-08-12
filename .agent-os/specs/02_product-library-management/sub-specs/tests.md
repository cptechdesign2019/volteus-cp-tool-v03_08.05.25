# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/02_product-library-management/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Test Coverage Strategy

### Testing Framework
- **Vitest** for unit and integration tests
- **@testing-library/react** for component testing
- **jsdom** for DOM simulation
- **MSW (Mock Service Worker)** for API mocking
- **@types/papaparse** for CSV parsing test support

### Test Organization
```
__tests__/
├── api/
│   └── products.test.ts
├── csv/
│   ├── product-csv-parser.test.ts
│   └── enhanced-product-csv-import.test.tsx
├── components/
│   ├── product-dashboard.test.tsx
│   ├── add-product-modal.test.tsx
│   └── product-csv-import-modal.test.tsx
├── lib/
│   └── import-logger.test.ts
├── utils/
│   └── product-validation.test.ts
└── integration/
    └── product-workflow.test.tsx
```

## Unit Tests

### Product API Functions (`__tests__/api/products.test.ts`)

#### `getProducts()` Tests
- **Should return filtered products by search query**
  - Test search across product names and descriptions
  - Test case-insensitive search functionality
  - Test special character and Unicode handling
  - Test empty search query behavior
- **Should filter products by brand and category**
  - Test single brand filtering
  - Test single category filtering  
  - Test combined brand and category filtering
  - Test non-existent brand/category handling
- **Should handle pagination correctly**
  - Test limit and offset parameters
  - Test total count accuracy with filters
  - Test empty result sets
  - Test large dataset pagination
- **Should implement conditional loading**
  - Test that no products load without search criteria
  - Test behavior with empty filters
  - Test performance with large datasets

#### `createProduct()` Tests
- **Should create product with valid data**
  - Test minimal required fields (brand, category, product_name)
  - Test complete product data with all optional fields
  - Test auto-generated product_id uniqueness
  - Test audit field population (created_by, created_at)
- **Should validate required fields**
  - Test missing brand field
  - Test missing category field
  - Test missing product_name field
  - Test empty string validation
- **Should validate pricing fields**
  - Test positive number validation
  - Test negative number rejection
  - Test string-to-number conversion ("$99.99" → 99.99)
  - Test invalid price format handling
- **Should validate URL fields**
  - Test valid HTTP/HTTPS URLs
  - Test invalid URL format rejection
  - Test empty URL handling (allowed)
  - Test malformed URL rejection

#### `batchCreateProducts()` Tests
- **Should process products in optimal batches**
  - Test 50-product batch size optimization
  - Test progress callback functionality
  - Test memory management between batches
  - Test batch isolation (one failure doesn't stop others)
- **Should handle upsert operations correctly**
  - Test new product creation
  - Test existing product updates based on product_id
  - Test conflict resolution strategies
  - Test data integrity during upserts
- **Should validate all products before processing**
  - Test pre-validation of entire dataset
  - Test early failure on invalid data
  - Test detailed error reporting per product
  - Test partial success scenarios
- **Should handle large CSV imports**
  - Test 500+ product imports (performance)
  - Test memory usage during large imports
  - Test timeout handling for long operations
  - Test progress tracking accuracy

#### `validateProductForAPI()` Tests
- **Should validate required fields correctly**
  - Test brand validation (required, non-empty)
  - Test category validation (required, non-empty)
  - Test product_name validation (required, min length 2)
  - Test field trimming and normalization
- **Should convert and validate pricing fields**
  - Test string price conversion ("$123.45" → 123.45)
  - Test currency symbol removal (",", "$", spaces)
  - Test negative price rejection
  - Test decimal precision handling
  - Test edge cases (0, null, undefined)
- **Should validate URL formats**
  - Test valid HTTP URLs
  - Test valid HTTPS URLs
  - Test invalid protocols (ftp://, etc.)
  - Test malformed URLs
  - Test relative URL handling
- **Should handle update vs create validation**
  - Test required field enforcement for creation
  - Test optional field validation for updates
  - Test partial data validation
  - Test unchanged field preservation

### CSV Processing Tests (`__tests__/csv/product-csv-parser.test.ts`)

#### `parseProductCSV()` Tests
- **Should parse valid CSV files correctly**
  - Test standard comma-separated format
  - Test quoted fields with commas
  - Test various encoding formats (UTF-8, UTF-16)
  - Test empty fields and null values
- **Should detect column mappings intelligently**
  - Test exact column name matches
  - Test case-insensitive matching
  - Test fuzzy matching with variations
  - Test common column naming patterns
- **Should handle CSV format variations**
  - Test different delimiter types (comma, semicolon, tab)
  - Test with/without header rows
  - Test BOM (Byte Order Mark) handling
  - Test line ending variations (CRLF, LF)
- **Should validate data during parsing**
  - Test data type validation
  - Test required field presence
  - Test format validation (URLs, prices)
  - Test data consistency checks

#### Papa Parse Integration Tests
- **Should configure Papa Parse correctly**
  - Test header detection
  - Test encoding detection
  - Test error handling configuration
  - Test streaming vs. complete parsing
- **Should handle Papa Parse errors gracefully**
  - Test malformed CSV files
  - Test encoding errors
  - Test file size limitations
  - Test timeout scenarios
- **Should provide detailed parsing results**
  - Test successful parsing data structure
  - Test error reporting format
  - Test metadata extraction
  - Test row-level error tracking

### Component Tests

#### `ProductDashboard` Component
- **Should render statistics cards correctly**
  - Test total products count display
  - Test unique brands/categories count
  - Test products with pricing statistics
  - Test recent additions calculation
- **Should handle conditional loading behavior**
  - Test initial state (no products displayed)
  - Test search trigger behavior
  - Test filter application
  - Test loading state management
- **Should manage search and filter state**
  - Test search input value persistence
  - Test filter dropdown selections
  - Test combined search and filter behavior
  - Test state reset functionality
- **Should integrate modal management**
  - Test add product modal opening
  - Test CSV import modal opening
  - Test modal closing and state cleanup
  - Test modal interaction prevention during operations

#### `AddProductModal` Component
- **Should validate form inputs in real-time**
  - Test required field validation display
  - Test price format validation
  - Test URL format validation
  - Test form submission prevention with errors
- **Should handle form submission correctly**
  - Test successful product creation flow
  - Test error handling and display
  - Test loading state during submission
  - Test form reset after successful submission
- **Should manage brand and category inputs**
  - Test dropdown population from existing data
  - Test manual entry for new brands/categories
  - Test validation of dropdown selections
  - Test fallback behavior for empty dropdowns
- **Should generate product IDs automatically**
  - Test product ID generation on form submission
  - Test product ID uniqueness
  - Test product ID format validation
  - Test collision handling

#### `ProductCsvImportModal` Component
- **Should handle file upload correctly**
  - Test CSV file selection and validation
  - Test file size limit enforcement
  - Test MIME type validation
  - Test file reading and parsing initiation
- **Should display column mapping interface**
  - Test suggested mapping display
  - Test manual mapping controls
  - Test mapping validation and errors
  - Test "Accept All & Continue" functionality
- **Should show import progress tracking**
  - Test progress bar updates
  - Test batch processing display
  - Test error reporting during import
  - Test completion status display
- **Should handle import errors gracefully**
  - Test individual product validation errors
  - Test network errors during import
  - Test partial success scenarios
  - Test error summary and reporting

### Enhanced CSV Import Tests (`__tests__/csv/enhanced-product-csv-import.test.tsx`)

#### Column Mapping Tests
- **Should auto-detect common column patterns**
  - Test "Product Name" → product_name mapping
  - Test "Brand" → brand mapping variations
  - Test "Price" variations → dealer_price mapping
  - Test case-insensitive pattern matching
- **Should handle manual column mapping**
  - Test dropdown selection for unmapped columns
  - Test mapping validation and conflict detection
  - Test "Accept All & Continue" button functionality
  - Test mapping persistence during session
- **Should validate mapped data**
  - Test data type validation after mapping
  - Test required field validation
  - Test format validation (prices, URLs)
  - Test consistency checks across rows

#### Import Progress Tests
- **Should track progress accurately**
  - Test progress calculation during batch processing
  - Test progress bar visual updates
  - Test stage transitions (parsing → validation → import)
  - Test completion detection and display
- **Should handle progress callbacks**
  - Test progress callback frequency (not too often)
  - Test progress data structure
  - Test error handling in progress callbacks
  - Test UI responsiveness during updates
- **Should manage import state correctly**
  - Test state transitions between import steps
  - Test error state handling and recovery
  - Test cancellation functionality
  - Test restart capability after errors

#### Error Handling Tests
- **Should display validation errors clearly**
  - Test field-level error messages
  - Test row-level error grouping
  - Test error severity classification
  - Test actionable error suggestions
- **Should handle network errors gracefully**
  - Test connection loss during import
  - Test timeout scenarios
  - Test retry mechanisms
  - Test data consistency after network errors
- **Should provide comprehensive error reporting**
  - Test error summary generation
  - Test downloadable error reports
  - Test error categorization
  - Test error resolution guidance

## Integration Tests

### Complete Product Workflow (`__tests__/integration/product-workflow.test.tsx`)

#### End-to-End Product Lifecycle
- **Should create new product manually**
  1. Open add product modal
  2. Fill all required fields with valid data
  3. Submit form and verify creation
  4. Verify product appears in search results
  5. Verify dashboard statistics update
- **Should import products via CSV**
  1. Open CSV import modal
  2. Upload sample CSV file (Todd's master price sheet)
  3. Review and confirm column mapping
  4. Monitor import progress
  5. Verify successful import completion
  6. Verify products appear in catalog
- **Should search and filter products effectively**
  1. Import test product dataset
  2. Test search across product names
  3. Test brand filtering
  4. Test category filtering
  5. Test combined search and filter
  6. Verify result accuracy

#### CSV Import Integration
- **Should handle real-world CSV files**
  1. Load Todd's 588-product master price sheet
  2. Test column detection and mapping
  3. Validate all product data
  4. Process import with progress tracking
  5. Verify data integrity after import
- **Should handle various CSV formats**
  1. Test different column orders
  2. Test with/without headers
  3. Test different delimiters
  4. Test encoding variations
  5. Verify consistent import results

#### Error Recovery Integration
- **Should recover from import failures**
  1. Start CSV import with invalid data
  2. Verify error detection and reporting
  3. Fix data issues and retry import
  4. Verify partial success handling
  5. Verify data consistency

## Performance Tests

### Load Testing Scenarios
- **Large product catalog handling (1000+ products)**
  - Test search performance with large datasets
  - Test pagination efficiency
  - Test memory usage during browsing
  - Test component rendering performance
- **CSV import performance testing**
  - Test 500+ product import times
  - Test memory usage during large imports
  - Test progress tracking accuracy
  - Test concurrent import prevention
- **Search and filtering performance**
  - Test search response times with large catalogs
  - Test filter application speed
  - Test combined search and filter performance
  - Test database query optimization

### Memory Management Tests
- **Component cleanup verification**
  - Test CSV parser cleanup after import
  - Test file object URL revocation
  - Test event listener removal
  - Test large dataset cleanup
- **Long-running session testing**
  - Test extended search sessions
  - Test multiple CSV imports
  - Test modal open/close cycles
  - Test memory leak detection

## Mocking Requirements

### Supabase Client Mock
```typescript
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  auth: {
    getUser: jest.fn(() => ({ data: { user: mockUser } })),
  },
};
```

### Papa Parse Mock
```typescript
export const mockPapaparse = {
  parse: jest.fn((file, options) => {
    if (options.complete) {
      options.complete({
        data: mockCsvData,
        errors: [],
        meta: { 
          fields: mockHeaders,
          delimiter: ',',
          linebreak: '\n'
        }
      });
    }
  })
};
```

### CSV Test Data
```typescript
export const mockProductCsvData = [
  {
    'Product Name': 'Test Speaker',
    'Brand': 'Test Audio',
    'Category': 'Speakers',
    'Dealer Price': '$299.99',
    'MSRP': '$399.99',
    'Description': 'High-quality test speaker'
  },
  {
    'Product Name': 'Test Amplifier',
    'Brand': 'Test Audio',
    'Category': 'Amplifiers', 
    'Dealer Price': '$599.99',
    'MSRP': '$799.99',
    'Description': 'Professional test amplifier'
  }
];

export const mockHeaders = [
  'Product Name', 'Brand', 'Category', 
  'Dealer Price', 'MSRP', 'Description'
];
```

### API Response Mocks
```typescript
export const mockProductData = {
  id: 'prod_123',
  product_id: 'PROD10001',
  brand: 'Test Brand',
  category: 'Test Category',
  product_name: 'Test Product',
  dealer_price: 99.99,
  msrp: 149.99,
  description: 'Test product description',
  created_at: '2025-01-08T10:00:00Z',
  updated_at: '2025-01-08T10:00:00Z'
};

export const mockImportResponse = {
  success: true,
  summary: {
    created: 2,
    updated: 0,
    failed: 0,
    total: 2,
    errors: []
  }
};
```

## Test Data Management

### Test Database Setup
```sql
-- Test data for product library testing
INSERT INTO products (product_id, brand, category, product_name, dealer_price, msrp, created_by) VALUES
('TEST001', 'Test Audio', 'Speakers', 'Test Speaker Model A', 299.99, 399.99, auth.uid()),
('TEST002', 'Test Video', 'Displays', 'Test Monitor 24"', 599.99, 799.99, auth.uid()),
('TEST003', 'Test Control', 'Controllers', 'Test Control Panel', 899.99, 1199.99, auth.uid());
```

### CSV Test Files
```csv
Product Name,Brand,Category,Dealer Price,MSRP,Description
"Test Import Product 1","Import Brand","Import Category","$199.99","$299.99","First test import product"
"Test Import Product 2","Import Brand","Import Category","$399.99","$499.99","Second test import product"
```

## Continuous Integration

### Test Automation
- **Pre-commit hooks** for running unit tests
- **Pull request validation** with full test suite
- **Nightly integration tests** with real CSV files
- **Performance regression testing** on large datasets

### Coverage Requirements
- **Unit test coverage**: Minimum 85% for API functions
- **Component test coverage**: Minimum 75% for UI components
- **CSV processing coverage**: Minimum 90% for import functionality
- **Integration test coverage**: All critical user workflows

### Test Performance Monitoring
- **Test execution time tracking**
- **Memory usage monitoring during tests**
- **Flaky test detection and reporting**
- **Test result trends and analytics**

### Quality Gates
- **All tests must pass** before merge
- **No reduction in test coverage** allowed
- **Performance tests must meet benchmarks**
- **CSV import tests must handle real-world data**
