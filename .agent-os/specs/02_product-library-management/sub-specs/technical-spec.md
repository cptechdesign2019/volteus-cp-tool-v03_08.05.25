# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/02_product-library-management/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Technical Requirements

### Database Requirements
- **Products Table**: Comprehensive AV product catalog with pricing and specifications
- **Dynamic Brand/Category Management**: Auto-populated dropdowns from actual product data
- **Pricing Fields**: Dealer price, MSRP, MAP price with decimal precision
- **Asset Management**: Spec sheet URLs, image URLs with validation
- **Audit Trail**: Created/updated timestamps with user tracking
- **Product ID Generation**: Auto-generated business identifiers (PROD##### format)

### CSV Import System Requirements
- **Papa Parse Integration**: Robust CSV parsing with error handling
- **Smart Column Detection**: Automatic mapping of common column variations
- **Manual Column Mapping**: UI interface for custom CSV formats
- **Data Validation**: Comprehensive field-level validation with detailed error reporting
- **Progress Tracking**: Real-time progress bars with batch processing display
- **Error Recovery**: Proper error display instead of false success messages
- **Batch Processing**: Chunked processing for large files (50 records per batch)

### UI/UX Specifications
- **Conditional Loading**: No products load until search criteria applied
- **Professional Statistics Dashboard**: Real-time metrics with card-based layout
- **Enhanced Search Interface**: Debounced search across multiple fields
- **Modal Management**: Add product and CSV import modals with validation
- **Loading States**: Skeleton loading, progress bars, and empty state handling
- **Error Display**: Clear, actionable error messages throughout

### Integration Requirements
- **Product Library Integration**: Direct integration with quotes system for equipment selection
- **Brand/Category Filtering**: Dynamic dropdowns populated from actual product data
- **Real-time Statistics**: Live updates of product counts and catalog metrics
- **File Upload Handling**: CSV file processing with memory management
- **API Layer**: RESTful operations with comprehensive error handling

### Performance Criteria
- **Search Response**: <500ms for filtered product queries
- **CSV Import**: Handle 1000+ product records with progress tracking
- **Page Load**: Initial load <2 seconds (without auto-loading data)
- **Memory Management**: Efficient handling of large product catalogs
- **Batch Processing**: Optimal chunk size for large imports (tested with 588 products)

## Approach Options

**Option A: Enhanced CSV Import with Smart Detection** (Selected)
- Pros: Handles real-world CSV variations, excellent user experience, robust error handling
- Cons: More complex implementation, requires extensive validation logic
- Performance: Excellent with proper batch processing

**Option B: Simple CSV Import with Fixed Format**
- Pros: Easier implementation, faster development
- Cons: Poor user experience with format mismatches, brittle parsing
- Performance: Good but limited flexibility

**Option C: Manual Product Entry Only**
- Pros: Complete control over data quality, simple validation
- Cons: Extremely time-consuming for large catalogs, poor scalability
- Performance: Not applicable for bulk operations

**Rationale:** Option A provides the flexibility needed for real-world business scenarios where CSV formats vary, while maintaining data quality through comprehensive validation.

## External Dependencies

- **papaparse** - Advanced CSV parsing and processing
  - Justification: Handles complex CSV scenarios, memory-efficient streaming, excellent error reporting
- **@radix-ui/react-progress** - Progress bar component for import tracking
  - Justification: Accessible, customizable progress indicators for long-running operations
- **@types/papaparse** - TypeScript definitions for Papa Parse
  - Justification: Essential for type safety in CSV processing operations
- **@tanstack/react-query** - Data fetching and state management
  - Justification: Optimistic updates, caching, and excellent developer experience for product operations

## Component Architecture

### Page Structure
```
product-library/page.tsx (Server Component)
├── product-dashboard.tsx (Client Component)
│   ├── product-statistics-cards.tsx
│   ├── product-search-filters.tsx
│   ├── product-table.tsx
│   ├── add-product-modal.tsx
│   └── product-csv-import-modal.tsx
│       └── enhanced-product-csv-import.tsx
│           ├── column-mapping-dialog.tsx
│           └── product-import-preview.tsx
```

### API Layer
```
lib/api/products.ts
├── getProducts() - Search and filter with conditional loading
├── getProductById() - Single product details
├── createProduct() - Add new product with validation
├── updateProduct() - Update existing product
├── deleteProduct() - Soft delete with dependency validation
├── getProductStats() - Dashboard statistics
├── getBrands() - Dynamic brand list from products
├── getCategories() - Dynamic category list from products
├── batchCreateProducts() - Bulk import with progress tracking
└── validateProductForAPI() - Comprehensive validation logic
```

### CSV Processing Architecture
```
lib/product-csv-parser.ts
├── parseProductCSV() - Papa Parse integration
├── validateProductData() - Field-level validation
├── detectColumnMapping() - Smart column detection
├── convertUiMappingToParserMapping() - UI to parser mapping conversion
└── sanitizeProductData() - Data cleaning and formatting

lib/import-logger.ts
├── logImportStart() - Initialize import session
├── logDataMapping() - Record column mapping decisions
├── logValidationResults() - Track validation outcomes
├── logBatchProgress() - Record batch processing progress
└── logImportCompletion() - Final import results
```

## Enhanced CSV Import Features

### Smart Column Detection
- **Automatic Mapping**: Recognizes common column name variations
- **Fuzzy Matching**: Handles case variations and common misspellings
- **User Confirmation**: Presents suggested mappings for user approval
- **Manual Override**: Allows custom mapping for non-standard formats

### Column Mapping Interface
- **Visual Mapping**: Drag-and-drop or dropdown selection for column mapping
- **Preview Integration**: Shows how mapping affects data interpretation
- **Validation Feedback**: Real-time validation of mapped data
- **"Accept All & Continue"**: Quick approval of suggested mappings

### Error Handling & Recovery
- **Field-Level Errors**: Specific validation errors for each product field
- **Batch Error Reporting**: Comprehensive error summary across all batches
- **Progress Persistence**: Maintains progress state during long imports
- **Partial Success Handling**: Imports valid rows when some rows fail

### Data Processing Pipeline
```
CSV Upload → Parse with Papa Parse → Detect Columns → 
Map Columns → Validate Data → Preview Results → 
Batch Process → Track Progress → Complete Import → 
Generate Summary Report
```

## Data Validation Logic

### Price Field Validation
```typescript
// Enhanced price validation with string-to-number conversion
function validatePriceField(value: any, fieldName: string): { isValid: boolean; numericValue?: number; error?: string } {
  if (value === undefined || value === null || value === '') {
    return { isValid: true }; // Optional field
  }
  
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and spaces
    const cleanValue = value.replace(/[$,\s]/g, '');
    const numeric = parseFloat(cleanValue);
    
    if (isNaN(numeric) || numeric < 0) {
      return { isValid: false, error: `${fieldName} must be a positive number` };
    }
    
    return { isValid: true, numericValue: numeric };
  }
  
  if (typeof value === 'number') {
    if (value < 0) {
      return { isValid: false, error: `${fieldName} must be a positive number` };
    }
    return { isValid: true, numericValue: value };
  }
  
  return { isValid: false, error: `${fieldName} must be a number` };
}
```

### URL Validation
```typescript
function validateURL(url: string): boolean {
  if (!url) return true; // Optional field
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### Product ID Generation
```typescript
function generateProductId(): string {
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `PROD${timestamp}${random}`;
}
```

## Performance Optimization

### Batch Processing Strategy
- **Optimal Batch Size**: 50 products per batch (tested with 588-product import)
- **Memory Management**: Garbage collection between batches
- **Progress Tracking**: Real-time progress updates
- **Error Isolation**: Batch-level error handling prevents cascading failures

### Database Optimization
- **Upsert Strategy**: Updates existing products instead of creating duplicates
- **Index Usage**: Optimized queries with proper indexing on product_id, brand, category
- **Connection Pooling**: Efficient database connection management
- **Query Batching**: Minimize database round trips

### UI Performance
- **Conditional Loading**: Prevents performance issues with large catalogs
- **Virtual Scrolling**: For large product lists (future enhancement)
- **Debounced Search**: 300ms delay for optimal search performance
- **Lazy Loading**: Load additional data as needed

## Security Considerations

### Input Validation
- **CSV Security**: Sanitize all CSV input to prevent injection attacks
- **File Size Limits**: Reasonable limits on CSV file uploads
- **MIME Type Validation**: Ensure only CSV files are processed
- **Data Sanitization**: Clean all input data before database insertion

### Access Control
- **Authentication Required**: All product operations require valid authentication
- **Role-Based Access**: Different permissions for viewing vs. editing products
- **Audit Trail**: Track all product modifications with user attribution
- **Data Integrity**: Comprehensive validation prevents corrupt data

### API Security
- **Rate Limiting**: Prevent abuse of CSV import endpoints
- **Input Sanitization**: All API inputs validated and sanitized
- **Error Handling**: Secure error messages that don't leak sensitive information
- **Database Security**: Parameterized queries prevent SQL injection

## Testing Strategy

### Unit Tests
- CSV parsing with various file formats and edge cases
- Product validation logic with comprehensive test scenarios
- Price field conversion and validation
- Product ID generation and uniqueness
- API functions with mocked Supabase client

### Integration Tests
- Complete CSV import workflow with real data files
- Product CRUD operations end-to-end
- Search and filtering functionality
- Modal interactions and form submissions
- Progress tracking and error handling

### Performance Tests
- Large CSV file imports (1000+ products)
- Search responsiveness with large product catalogs
- Memory usage during extended sessions
- Concurrent user operations

### Error Scenario Tests
- Invalid CSV formats and corrupted files
- Network failures during import operations
- Database constraint violations
- File upload failures and recovery
