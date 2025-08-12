# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/02_product-library-management/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## API Architecture

### API Layer Functions
Product management operations use server-side functions in `src/lib/api/products.ts` that interface with Supabase client. Enhanced with comprehensive validation, batch processing, and error handling for production use.

### Authentication
- **Supabase Auth**: JWT-based authentication through Supabase client
- **RLS Enforcement**: Database-level security through Row Level Security policies
- **Service Role Access**: Special service role for CSV import operations
- **Session Management**: Automatic token refresh and session handling

## Core API Functions

### Product Catalog Management

#### `getProducts(filters?: ProductFilters)`
**Purpose:** Retrieve filtered list of products with conditional loading  
**Parameters:**
- `searchQuery?: string` - Search across product name, description, brand, category
- `brand?: string` - Filter by specific brand
- `category?: string` - Filter by specific category
- `priceRange?: { min: number, max: number }` - Filter by price range
- `hasAssets?: boolean` - Filter products with/without spec sheets or images
- `limit?: number` - Pagination limit (default: 50)
- `offset?: number` - Pagination offset

**Response Format:**
```typescript
{
  success: boolean;
  data: Product[];
  total: number;
  error?: string;
}

interface Product {
  id: string;
  product_id: string; // Business identifier
  brand: string;
  category: string;
  product_name: string;
  product_number?: string;
  description?: string;
  dealer_price?: number;
  msrp?: number;
  map_price?: number;
  primary_distributor?: string;
  secondary_distributor?: string;
  tertiary_distributor?: string;
  spec_sheet_url?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}
```

**Error Handling:**
- Database connection errors
- Authentication failures
- Invalid filter parameters
- Search query formatting issues
- Performance timeout (>5 seconds)

#### `getProductById(productId: string)`
**Purpose:** Retrieve single product details by ID  
**Parameters:**
- `productId: string` - Product database ID or business product_id

**Response Format:**
```typescript
{
  success: boolean;
  data?: Product;
  error?: string;
}
```

**Error Handling:**
- Product not found (404)
- Invalid product ID format
- Authentication failures

#### `createProduct(productData: CreateProductData)`
**Purpose:** Create new product with auto-generated product ID  
**Parameters:**
```typescript
interface CreateProductData {
  brand: string;
  category: string;
  product_name: string;
  product_number?: string;
  description?: string;
  dealer_price?: number;
  msrp?: number;
  map_price?: number;
  primary_distributor?: string;
  secondary_distributor?: string;
  tertiary_distributor?: string;
  spec_sheet_url?: string;
  image_url?: string;
}
```

**Response Format:**
```typescript
{
  success: boolean;
  data?: Product;
  error?: string;
}
```

**Business Logic:**
- Auto-generates unique product_id using `generateProductId()`
- Validates all pricing fields for positive values
- Validates URL formats for spec_sheet_url and image_url
- Ensures required fields are present and non-empty
- Sets created_by to current authenticated user

**Error Handling:**
- Validation errors for required fields
- Price validation failures (negative values)
- URL format validation errors
- Database constraint violations
- Duplicate product_id generation conflicts

#### `updateProduct(productId: string, productData: Partial<Product>)`
**Purpose:** Update existing product information  
**Parameters:**
- `productId: string` - Product database ID
- `productData: Partial<Product>` - Fields to update

**Response Format:**
```typescript
{
  success: boolean;
  data?: Product;
  error?: string;
}
```

**Business Logic:**
- Validates only provided fields
- Maintains data integrity for pricing relationships
- Updates updated_at timestamp automatically
- Sets updated_by to current authenticated user

**Error Handling:**
- Product not found
- Validation errors for updated fields
- Unauthorized modifications
- Optimistic locking conflicts

#### `deleteProduct(productId: string)`
**Purpose:** Delete product after dependency validation  
**Parameters:**
- `productId: string` - Product database ID

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

**Business Logic:**
- Checks for dependencies in quotes and projects
- Prevents deletion of products in active use
- Performs soft delete to maintain audit trail
- Returns dependency count for user information

**Error Handling:**
- Product has active dependencies
- Product not found
- Insufficient permissions
- Foreign key constraint violations

### Product Statistics and Analytics

#### `getProductStats()`
**Purpose:** Retrieve dashboard statistics for product overview  
**Parameters:** None

**Response Format:**
```typescript
{
  success: boolean;
  data?: {
    total_products: number;
    unique_brands: number;
    unique_categories: number;
    products_with_pricing: number;
    products_with_assets: number;
    recent_additions: number; // Last 30 days
  };
  error?: string;
}
```

**Error Handling:**
- Database aggregation errors
- Performance timeout issues
- Authentication failures

#### `getBrands()`
**Purpose:** Get dynamic list of all brands from product catalog  
**Parameters:** None

**Response Format:**
```typescript
{
  success: boolean;
  data?: string[];
  error?: string;
}
```

#### `getCategories()`
**Purpose:** Get dynamic list of all categories from product catalog  
**Parameters:** None

**Response Format:**
```typescript
{
  success: boolean;
  data?: string[];
  error?: string;
}
```

### CSV Import Operations

#### `parseProductCSV(file: File, options?: ParseOptions)`
**Purpose:** Parse CSV file using Papa Parse with smart column detection  
**Parameters:**
- `file: File` - CSV file object
- `options?: ParseOptions` - Parsing configuration

**Response Format:**
```typescript
{
  success: boolean;
  data?: {
    headers: string[];
    rows: any[];
    mapping: ColumnMapping;
    suggested_mapping: ColumnMapping;
  };
  warnings?: string[];
  error?: string;
}

interface ColumnMapping {
  product_id?: string;
  brand?: string;
  category?: string;
  product_name?: string;
  product_number?: string;
  description?: string;
  dealer_price?: string;
  msrp?: string;
  map_price?: string;
  primary_distributor?: string;
  secondary_distributor?: string;
  tertiary_distributor?: string;
  spec_sheet_url?: string;
  image_url?: string;
}
```

**Smart Column Detection Logic:**
```typescript
const COLUMN_PATTERNS = {
  product_name: /^(product[_\s]?name|name|item|title)/i,
  brand: /^(brand|manufacturer|make|company)/i,
  category: /^(category|type|class|group)/i,
  dealer_price: /^(dealer[_\s]?price|cost|wholesale)/i,
  msrp: /^(msrp|retail|list[_\s]?price)/i,
  map_price: /^(map|minimum[_\s]?advertised)/i,
  description: /^(description|details|notes|spec)/i,
  product_number: /^(product[_\s]?number|part[_\s]?number|sku|model)/i,
  spec_sheet_url: /^(spec[_\s]?sheet|specification[_\s]?url|doc)/i,
  image_url: /^(image[_\s]?url|photo|picture)/i
};
```

#### `validateProductForAPI(productData: Partial<Product>, isUpdate = false)`
**Purpose:** Comprehensive validation of product data before database operations  
**Parameters:**
- `productData: Partial<Product>` - Product data to validate
- `isUpdate: boolean` - Whether this is an update operation

**Response Format:**
```typescript
{
  isValid: boolean;
  errors: string[];
  cleanedData?: Partial<Product>;
}
```

**Validation Logic:**
```typescript
// Enhanced price validation with string-to-number conversion
if (productData.dealer_price !== undefined && productData.dealer_price !== null) {
  if (typeof productData.dealer_price === 'string') {
    const cleanValue = productData.dealer_price.replace(/[$,\s]/g, '');
    const numeric = parseFloat(cleanValue);
    if (isNaN(numeric) || numeric < 0) {
      errors.push('Dealer price must be a positive number');
    } else {
      productData.dealer_price = numeric; // Update in place
    }
  } else if (typeof productData.dealer_price !== 'number' || productData.dealer_price < 0) {
    errors.push('Dealer price must be a positive number');
  }
}

// URL validation
if (productData.spec_sheet_url) {
  try {
    new URL(productData.spec_sheet_url);
  } catch {
    errors.push('Spec sheet URL must be a valid URL');
  }
}
```

#### `batchCreateProducts(validatedData: Product[], progressCallback?: Function)`
**Purpose:** Bulk create products from validated CSV data with progress tracking  
**Parameters:**
- `validatedData: Product[]` - Pre-validated product data
- `progressCallback?: Function` - Progress update callback

**Response Format:**
```typescript
{
  success: boolean;
  summary?: {
    created: number;
    updated: number;
    failed: number;
    total: number;
    errors: string[];
  };
  error?: string;
}
```

**Batch Processing Logic:**
- **Chunk Size**: 50 products per batch for optimal performance
- **Error Isolation**: Individual product failures don't stop the batch
- **Progress Tracking**: Real-time progress updates via callback
- **Upsert Strategy**: Updates existing products based on product_id
- **Transaction Safety**: Each batch processed in a transaction

**Error Handling:**
- Individual product validation failures
- Database constraint violations
- Network connectivity issues
- Memory management for large imports
- Progress callback failures

## Enhanced Error Response Format

### Standard Error Structure
```typescript
interface APIError {
  success: false;
  error: string;
  details?: {
    field?: string;
    code?: string;
    message?: string;
    validation_errors?: ValidationError[];
  };
}

interface ValidationError {
  field: string;
  value: any;
  message: string;
  code: string;
}
```

### Error Codes and Messages
- **VALIDATION_ERROR** - Input validation failed
- **NOT_FOUND** - Product not found
- **UNAUTHORIZED** - Authentication required
- **FORBIDDEN** - Insufficient permissions
- **CONFLICT** - Product ID conflict or duplicate data
- **DATABASE_ERROR** - Database operation failed
- **NETWORK_ERROR** - Network connectivity issues
- **FILE_PROCESSING_ERROR** - CSV file processing failed
- **BATCH_PROCESSING_ERROR** - Bulk operation failed

### CSV Import Specific Errors
```typescript
interface CSVImportError {
  success: false;
  error: string;
  details: {
    row_number: number;
    raw_data: any;
    validation_errors: ValidationError[];
    column_mapping?: ColumnMapping;
  };
}
```

## Performance Optimization

### Caching Strategy
- **React Query caching** for product lists and statistics
- **Stale-while-revalidate** pattern for dashboard data
- **Optimistic updates** for product modifications
- **Background refetch** for real-time data consistency
- **Cache invalidation** on product creation/updates

### Database Query Optimization
```typescript
// Efficient product search with full-text search
const searchProducts = async (query: string, filters: ProductFilters) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .textSearch('fts', query, {
      type: 'websearch',
      config: 'english'
    })
    .eq(filters.brand ? 'brand' : '', filters.brand)
    .eq(filters.category ? 'category' : '', filters.category)
    .order('created_at', { ascending: false })
    .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50));
    
  return { data, error };
};
```

### Batch Processing Optimization
- **Optimal Batch Size**: 50 products per batch (tested with 588-product import)
- **Memory Management**: Garbage collection between batches
- **Connection Pooling**: Efficient database connection reuse
- **Progress Debouncing**: Throttled progress updates (every 100ms)

### Rate Limiting and Performance
- **Client-side debouncing** for search operations (300ms)
- **Request deduplication** for identical simultaneous requests
- **Batch operation queuing** to prevent overlapping imports
- **Memory usage monitoring** during large file processing

## Data Validation and Sanitization

### Input Validation Rules
```typescript
const PRODUCT_VALIDATION_RULES = {
  brand: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-&.]+$/
  },
  category: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-&.]+$/
  },
  product_name: {
    required: true,
    minLength: 2,
    maxLength: 200
  },
  dealer_price: {
    type: 'number',
    minimum: 0,
    maximum: 999999.99
  },
  msrp: {
    type: 'number',
    minimum: 0,
    maximum: 999999.99
  },
  map_price: {
    type: 'number',
    minimum: 0,
    maximum: 999999.99
  },
  spec_sheet_url: {
    format: 'url',
    optional: true
  },
  image_url: {
    format: 'url',
    optional: true
  }
};
```

### Data Sanitization
- **HTML entity encoding** for text inputs
- **URL normalization** for consistent URL formatting
- **Price formatting** for consistent decimal precision
- **Text trimming** for leading/trailing whitespace removal
- **Special character handling** for brand and category names

## Security Considerations

### Input Security
- **CSV injection prevention** through content validation
- **File size limits** to prevent DoS attacks (max 10MB CSV files)
- **MIME type validation** to ensure only CSV files processed
- **Data sanitization** at multiple layers (input, validation, database)

### Access Control
- **Authentication required** for all product operations
- **Role-based permissions** for viewing vs. editing products
- **Service role isolation** for CSV import operations
- **Audit logging** for all product modifications

### API Security
- **Rate limiting** on CSV import endpoints (1 import per minute per user)
- **Input validation** at API boundary layer
- **Error message sanitization** to prevent information disclosure
- **SQL injection prevention** through parameterized queries

### Data Privacy
- **No PII in products** - all data is business catalog information
- **Access logging** for compliance requirements
- **Data retention** policies for product history
- **Secure file handling** for CSV uploads (no persistent storage)
