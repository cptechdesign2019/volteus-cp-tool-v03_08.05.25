# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-04-api-security-foundation/spec.md

> Created: 2025-08-04
> Version: 1.0.0

## Test Coverage Overview

This specification defines comprehensive test coverage for the API Security Foundation integration, ensuring all security middleware, permission systems, audit logging, and error handling work correctly across Todd's AV Management endpoints.

## Unit Tests

### Permission System Tests (`src/lib/permissions.test.ts`)

**hasPermission Function**
- Test technician role has basic read permissions
- Test sales_rep role has customer and quote permissions
- Test project_manager role has enhanced management permissions  
- Test super_admin role has all permissions including delete operations
- Test invalid role returns false for all permissions
- Test invalid permission string returns false

**Role Permission Mapping**
- Verify ROLE_PERMISSIONS contains all defined roles
- Verify each role has appropriate permission sets
- Test AV-specific permissions are properly assigned
- Verify no permission overlaps or conflicts

### Auth Middleware Tests (`src/lib/auth-middleware.test.ts`)

**authenticateUser Function**
- Test valid user session returns proper user context
- Test invalid/expired session returns null
- Test user without profile returns null
- Test service role bypass for profile queries
- Test error handling for database failures

**withPermissions Middleware**
- Test middleware validates authentication before permissions
- Test permission checking with various role combinations
- Test rate limiting integration
- Test audit logging integration
- Test error response formatting

### Audit Logging Tests (`tests/audit-logging.test.ts`)

**logAuditEvent Function**
- Test audit log creation with all required fields
- Test tenant isolation in audit logs
- Test error handling for logging failures
- Test async logging doesn't block API responses
- Test audit log data serialization

## Integration Tests

### API Security Integration (`tests/api-security.test.ts`)

**Products API Security**
- Test GET /api/products requires authentication
- Test products:read permission enforcement
- Test products:create permission for POST requests
- Test products:update permission for PUT requests
- Test products:delete permission for DELETE requests
- Test rate limiting on product endpoints
- Test audit logging for all product operations

**Customers API Security**
- Test customer endpoints require appropriate permissions
- Test customer creation with different user roles
- Test customer update restrictions by role
- Test customer deletion protection and permissions
- Test customer contact management permissions

**Quotes API Security**
- Test quote creation permissions
- Test quote update restrictions
- Test quote status change permissions
- Test quote duplication permissions
- Test quote export permissions

**Projects API Security**
- Test project creation from quote permissions
- Test project update permissions by role
- Test project status change restrictions
- Test project assignment permissions

### Permission Matrix Testing (`tests/permission-matrix.test.ts`)

**Technician Role Testing**
- Can read products, customers, quotes, projects
- Cannot create or modify any resources
- Cannot access admin or management functions
- Cannot delete any resources

**Sales Rep Role Testing**
- Can read and create customers and quotes
- Can update own quotes and customers
- Cannot delete customers with active quotes
- Cannot access admin functions
- Can generate basic reports

**Project Manager Role Testing**
- Can manage all projects and assign technicians
- Can create and modify products
- Can access management reports
- Cannot delete customers with dependencies
- Can manage user assignments

**Super Admin Role Testing**
- Can perform all operations
- Can delete resources with proper warnings
- Can access all reports and exports
- Can manage system configuration
- Can view audit logs

### Error Handling Tests (`tests/error-handling.test.ts`)

**Authentication Errors**
- Test 401 response for missing authentication
- Test 401 response for invalid/expired tokens
- Test proper error message formatting
- Test audit logging of authentication failures

**Authorization Errors**
- Test 403 response for insufficient permissions
- Test permission-specific error messages
- Test role-based access denials
- Test audit logging of permission denials

**Rate Limiting Errors**
- Test 429 response when rate limit exceeded
- Test rate limit headers in responses
- Test rate limit reset behavior
- Test rate limiting by client IP

**Validation Errors**
- Test 400 response for invalid input data
- Test field-specific validation messages
- Test required field enforcement
- Test data type validation

**Server Errors**
- Test 500 response for database failures
- Test error logging without exposing internals
- Test graceful degradation scenarios
- Test audit logging of system errors

## Feature Tests

### End-to-End Security Workflows (`tests/e2e-security.test.ts`)

**Complete Product Management Workflow**
1. Authenticate as sales rep
2. Attempt to create product (should fail with 403)
3. Authenticate as project manager  
4. Create new product successfully
5. Update product information
6. Verify audit logs created for all operations
7. Attempt deletion as sales rep (should fail)
8. Delete as super admin successfully

**Quote Creation and Management Workflow**
1. Authenticate as technician
2. View available products (read-only)
3. Attempt quote creation (should fail with 403)
4. Authenticate as sales rep
5. Create customer and quote successfully
6. Update quote with additional items
7. Duplicate quote for new revision
8. Verify all operations logged to audit trail

**Customer Data Protection Workflow**
1. Create customer with associated quote
2. Attempt customer deletion (should fail with dependency error)
3. Verify customer data isolated by tenant
4. Test cross-tenant data access prevention
5. Verify audit trail shows all access attempts

### Security Boundary Testing (`tests/security-boundaries.test.ts`)

**Multi-Tenant Isolation**
- Test users cannot access other tenant's data
- Test API responses filtered by tenant context
- Test database queries include tenant isolation
- Test audit logs are tenant-specific

**Role Escalation Prevention**
- Test users cannot perform actions above their role
- Test permission inheritance works correctly
- Test role-based UI restrictions (future integration)
- Test session hijacking prevention

**Data Integrity Protection**
- Test foreign key constraints are enforced
- Test business rule validation
- Test data consistency across operations
- Test transaction rollback scenarios

## Mocking Requirements

### Authentication Mocking (`tests/mocks/auth.ts`)

**User Context Mocking**
```typescript
const mockUsers = {
  technician: { id: 'tech-1', role: 'technician', tenant_id: 'tenant-1' },
  sales_rep: { id: 'sales-1', role: 'sales_rep', tenant_id: 'tenant-1' },
  project_manager: { id: 'pm-1', role: 'project_manager', tenant_id: 'tenant-1' },
  super_admin: { id: 'admin-1', role: 'super_admin', tenant_id: 'tenant-1' }
}
```

**Permission Mocking Strategy**
- Mock `hasPermission()` function for different scenarios
- Mock `authenticateUser()` to return different user contexts
- Mock rate limiting for controlled testing
- Mock audit logging to verify call patterns

### API Response Mocking (`tests/mocks/api.ts`)

**Todd's Business Logic Mocking**
- Mock product database operations (CRUD)
- Mock customer database operations with relationships
- Mock quote creation and management
- Mock project workflow operations
- Mock report generation functions

**Database Operation Mocking**
```typescript
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({ eq: jest.fn(() => ({ data: mockData })) })),
    insert: jest.fn(() => ({ data: mockInsertResult })),
    update: jest.fn(() => ({ eq: jest.fn(() => ({ data: mockUpdateResult })) })),
    delete: jest.fn(() => ({ eq: jest.fn(() => ({ data: mockDeleteResult })) }))
  }))
}
```

### Error Scenario Mocking (`tests/mocks/errors.ts`)

**Database Error Simulation**
- Mock database connection failures
- Mock constraint violation errors
- Mock timeout scenarios
- Mock data corruption scenarios

**Rate Limiting Simulation**
- Mock rate limit exceeded scenarios
- Mock rate limit reset behavior
- Mock client IP detection
- Mock rate limit storage failures

## Performance Testing

### Security Overhead Measurement (`tests/performance/security-overhead.test.ts`)

**Middleware Performance**
- Measure authentication overhead per request
- Measure permission checking latency
- Measure audit logging impact
- Measure rate limiting overhead

**Load Testing Scenarios**
- Test API performance under normal load with security
- Test rate limiting behavior under high load
- Test audit logging performance with concurrent requests
- Test database performance with security queries

### Memory and Resource Testing (`tests/performance/resource-usage.test.ts`)

**Memory Usage Monitoring**
- Monitor memory usage during security operations
- Test for memory leaks in middleware
- Measure audit log storage growth
- Test cleanup and garbage collection

## Test Execution Strategy

### Test Environment Setup
- Use dedicated test database with sample data
- Mock external services (Supabase auth, Monday.com)
- Set up test tenant and user accounts
- Configure test-specific environment variables

### Continuous Integration Requirements
- All security tests must pass before deployment
- Performance tests must meet acceptable thresholds
- Test coverage must exceed 90% for security code
- Security boundary tests must pass for all roles

### Test Data Management
- Use deterministic test data for consistent results
- Clean up test data after each test run
- Maintain test user accounts with known permissions
- Reset rate limiting state between test runs

## Security Test Validation

### Penetration Testing Scenarios
- Test for common authentication bypass attempts
- Test for privilege escalation vulnerabilities
- Test for data exposure through error messages
- Test for rate limiting bypass attempts

### Compliance Testing
- Verify audit logs meet compliance requirements
- Test data retention and deletion policies
- Verify user permission documentation
- Test security monitoring and alerting

### Edge Case Testing
- Test behavior with malformed requests
- Test handling of extremely large payloads
- Test concurrent access to same resources
- Test system behavior during partial failures