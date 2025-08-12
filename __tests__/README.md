# Test Suite Documentation

## Overview
Comprehensive test suite for the Volteus AV Management Tool, focusing on our enhanced CSV import functionality and core API operations.

## Test Structure

### 📁 Directory Structure
```
__tests__/
├── README.md           # This file
├── setup.ts           # Global test configuration
├── csv/               # CSV parsing and import tests
│   └── product-csv-parser.test.ts
├── api/               # API endpoint tests
│   └── products.test.ts
└── lib/               # Library/utility tests
    └── import-logger.test.ts
```

## Test Categories

### 🧬 CSV Parser Tests (`csv/product-csv-parser.test.ts`)
Tests our enhanced product CSV parser with smart column mapping:

- **Valid CSV parsing** - Standard format handling
- **Column mapping validation** - Smart suggestions for mismatched headers
- **Data validation** - Price formats, URLs, field constraints
- **Error handling** - Missing fields, invalid data, duplicates
- **Edge cases** - Special characters, BOM, large files
- **Performance** - Processing speed for reasonable datasets

### 🔌 API Tests (`api/products.test.ts`)
Tests our enhanced batch product creation API:

- **Authentication flows** - User verification, session handling
- **Batch processing** - Chunked uploads, progress tracking
- **Data validation** - Field validation, type conversion
- **Error handling** - Database errors, validation failures
- **UPSERT behavior** - Duplicate handling with conflict resolution
- **Progress callbacks** - Real-time status updates

### 📝 Import Logger Tests (`lib/import-logger.test.ts`)
Tests our enhanced logging system:

- **Log creation** - Import tracking, unique IDs
- **Data mapping logs** - Column mapping issues, resolutions
- **Result logging** - Success/failure tracking, statistics
- **10-log retention** - Automatic cleanup, chronological order
- **LocalStorage handling** - Persistence, corruption recovery
- **Edge cases** - Large datasets, Unicode support

## Running Tests

### Basic Commands
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Test Categories
```bash
# Run only CSV parser tests
npx vitest csv

# Run only API tests
npx vitest api

# Run only logging tests
npx vitest lib
```

## Test Configuration

### Vitest Setup (`vitest.config.ts`)
- **Environment**: jsdom for DOM testing
- **Global setup**: `__tests__/setup.ts`
- **Path aliases**: `@/` mapped to `src/`
- **Coverage**: v8 provider with HTML reports

### Mock Configuration (`setup.ts`)
- **localStorage**: Complete mock for logger tests
- **console**: Silenced during tests for clean output
- **URL**: Mock constructor for validation tests
- **crypto**: Mock UUID generation
- **fetch**: Mock for API calls

## Key Features Tested

### ✅ Enhanced CSV Import
- Smart column detection and mapping
- Todd's proven authentication patterns
- Robust error handling and validation
- Real-time progress tracking

### ✅ Data Integrity
- Field validation and type conversion
- UPSERT conflict resolution
- Audit trail logging (created_by, updated_by)
- Comprehensive error reporting

### ✅ User Experience
- Progress callbacks and status updates
- Detailed error messages with guidance
- Log retention and accessibility
- Edge case handling

## Coverage Goals

### Target Coverage: 80%+
- **CSV Parser**: 90%+ (core functionality)
- **API Functions**: 85%+ (critical operations)
- **Import Logger**: 80%+ (utility functions)

### Excluded from Coverage
- Node modules
- Configuration files
- Type definitions
- Build artifacts

## Test Data

### CSV Fixtures
Tests use realistic CSV data with various scenarios:
- Valid product data with all fields
- Missing required columns
- Invalid data types and formats
- Duplicate product IDs
- Special characters and encoding issues
- Large datasets for performance testing

### Mock API Responses
Comprehensive mocking of Supabase operations:
- Authentication success/failure scenarios
- Database insert/upsert operations
- Error conditions and edge cases
- Progress tracking callbacks

## Best Practices

### Writing Tests
1. **Descriptive names** - Clear test purpose
2. **Arrange-Act-Assert** - Structured test flow
3. **Mock isolation** - Independent test runs
4. **Edge case coverage** - Handle real-world scenarios
5. **Performance awareness** - Reasonable execution times

### Maintaining Tests
1. **Update with features** - Keep tests current
2. **Fix broken tests immediately** - Don't ignore failures
3. **Review coverage reports** - Identify gaps
4. **Refactor when needed** - Keep tests maintainable

## Integration with CI/CD

### Pre-commit Hooks
Tests run automatically before commits to ensure code quality.

### Build Pipeline
All tests must pass before deployment to prevent regressions.

## Future Enhancements

### Planned Test Additions
- Component testing with React Testing Library
- Integration tests with test database
- E2E testing with Playwright
- Performance benchmarking
- Visual regression testing

### Test Infrastructure
- Parallel test execution
- Test result caching
- Database seeding for integration tests
- Automated test data generation