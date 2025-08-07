# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-04-api-security-foundation/spec.md

> Created: 2025-08-04
> Version: 1.0.0

## Technical Requirements

### API Security Middleware Integration
- **Scope**: Wrap all identified Todd API endpoints with Volteus `withPermissions()` middleware
- **Authentication**: Leverage existing Volteus `authenticateUser()` function for user context
- **Authorization**: Implement permission checks using Volteus `hasPermission()` system
- **Database Access**: Preserve Todd's existing single-tenant database queries and schema
- **Response Format**: Maintain consistent `NextResponse.json()` format across all endpoints
- **Error Handling**: Return appropriate HTTP status codes (401 for auth, 403 for permissions, 429 for rate limiting)

### Permission Mapping Strategy
- **Todd Role Mapping**: Map Todd's 4 roles to Volteus permission sets
  - `Super Admin` → `super_admin` role with all permissions
  - `Admin` → `project_manager` role with management permissions
  - `Sales` → `sales_rep` role with sales and customer permissions
  - `Technician` → `technician` role with basic read permissions
- **Granular Permissions**: Define AV-specific permissions for Todd's features
- **Permission Validation**: Use existing `ROLE_PERMISSIONS` mapping in `src/lib/permissions.ts`

### Audit Logging Requirements
- **Logging Function**: Use existing `logAuditEvent()` function from Volteus
- **Required Context**: user_id, action, resource_type, resource_id, IP address, timestamp
- **Business Actions**: Log all CRUD operations on customers, quotes, products, projects
- **Log Storage**: Store in existing `audit_logs` table (single-tenant scope)
- **Performance**: Async logging to avoid blocking API responses

### Rate Limiting Configuration
- **Implementation**: Use existing Volteus rate limiting in `src/lib/auth-middleware.ts`
- **Limits**: Apply existing rate limits (client IP based)
- **Scope**: Apply to all Todd API endpoints after authentication
- **Bypass**: No bypass for any user roles (security first)

## Approach Options

**Option A: Gradual Endpoint Migration**
- Pros: Lower risk, can test incrementally, easier debugging
- Cons: Longer implementation time, mixed security states during transition

**Option B: Comprehensive Security Wrapper** (Selected)
- Pros: Consistent security across all endpoints, faster overall implementation, unified approach
- Cons: Higher initial complexity, requires more thorough testing

**Option C: Custom Security Middleware**
- Pros: Could be tailored specifically for Todd's patterns
- Cons: Reinvents existing Volteus security, maintenance overhead, security risk

**Rationale**: Option B provides the most comprehensive security improvement while leveraging Volteus's proven security infrastructure. The consistent approach ensures no security gaps and makes future maintenance easier.

## Implementation Strategy

### Phase 1: Security Infrastructure Setup
1. **Permission Definition**: Define Todd-specific permissions in `src/lib/permissions.ts`
2. **Role Mapping**: Create mapping function for Todd roles to Volteus permissions
3. **Testing Framework**: Set up security middleware testing with mock scenarios

### Phase 2: API Endpoint Wrapping
1. **Identify All Endpoints**: Catalog all Todd API routes that need protection
2. **Apply Middleware**: Systematically wrap each endpoint with `withPermissions()`
3. **Add Audit Logging**: Implement `logAuditEvent()` calls for all business operations
4. **Error Handling**: Ensure consistent error responses and status codes

### Phase 3: Integration Testing
1. **Role-Based Testing**: Verify each role can access appropriate endpoints
2. **Permission Testing**: Test all permission scenarios and edge cases
3. **Audit Testing**: Validate audit logs are created for all operations
4. **Rate Limiting Testing**: Confirm rate limiting works correctly

## Todd-Specific Permission Definitions

### AV Management Permissions
```typescript
// Add to src/lib/permissions.ts
export type Permission = 
  // Existing permissions...
  // Todd AV Management permissions
  | 'products:read' | 'products:create' | 'products:update' | 'products:delete'
  | 'customers:read' | 'customers:create' | 'customers:update' | 'customers:delete'
  | 'quotes:read' | 'quotes:create' | 'quotes:update' | 'quotes:delete'
  | 'projects:read' | 'projects:create' | 'projects:update' | 'projects:delete'
  | 'reports:read' | 'reports:export'
```

### Role Permission Mapping
```typescript
// Update ROLE_PERMISSIONS in src/lib/permissions.ts
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  technician: [
    // Existing permissions...
    'products:read', 'customers:read', 'quotes:read', 'projects:read'
  ],
  
  sales_rep: [
    // Existing permissions...
    'products:read', 'customers:read', 'customers:create', 'customers:update',
    'quotes:read', 'quotes:create', 'quotes:update', 'projects:read', 'reports:read'
  ],
  
  project_manager: [
    // Existing permissions...
    'products:read', 'products:create', 'products:update',
    'customers:read', 'customers:create', 'customers:update',
    'quotes:read', 'quotes:create', 'quotes:update',
    'projects:read', 'projects:create', 'projects:update',
    'reports:read', 'reports:export'
  ],
  
  super_admin: [
    // ALL permissions including...
    'products:create', 'products:update', 'products:delete',
    'customers:delete', 'quotes:delete', 'projects:delete'
  ]
}
```

## API Endpoint Security Pattern

### Standard Wrapper Implementation
```typescript
// Before (Todd's unsecured endpoint):
export async function GET() {
  const data = await getProducts() // Direct query, no security
  return Response.json(data)
}

// After (Volteus-secured endpoint with Todd's business logic preserved):
export const GET = withPermissions(['products:read'], async (request, { user }) => {
  try {
    // Todd's existing business logic works unchanged
    const data = await getProducts() // Same function, same database queries
    
    // Added: Audit logging for compliance
    await logAuditEvent(user.id, 'product_list', 'products', null, {
      count: data?.length || 0
    })
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
})
```

### POST/PUT/DELETE Pattern
```typescript
export const POST = withPermissions(['products:create'], async (request, { user }) => {
  try {
    const body = await request.json()
    const result = await createProduct(body) // Todd's business logic
    await logAuditEvent(user.id, 'product_create', 'products', result.id, {
      name: body.name,
      category: body.category
    })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
})
```

## External Dependencies

**No new external dependencies required** - This implementation leverages existing Volteus security infrastructure:

- **Existing**: `src/lib/auth-middleware.ts` - Authentication and permission middleware
- **Existing**: `src/lib/permissions.ts` - Role and permission definitions
- **Existing**: Supabase audit logging capabilities
- **Existing**: Rate limiting implementation

**Justification**: Using existing infrastructure ensures consistency, reduces maintenance overhead, and leverages proven security patterns already implemented in Volteus.

## Performance Considerations

### Middleware Overhead
- **Expected Impact**: ~5-10% request processing overhead from middleware
- **Mitigation**: Optimize permission checks with caching if needed
- **Monitoring**: Track response times during implementation

### Audit Logging Impact
- **Expected Impact**: ~5% additional overhead from audit logging
- **Mitigation**: Async logging to prevent blocking API responses
- **Storage**: Audit logs will grow over time, plan for log rotation/archival

### Rate Limiting Efficiency
- **Expected Impact**: Minimal overhead from existing implementation
- **Benefit**: Protects against abuse and resource exhaustion
- **Monitoring**: Track rate limit hits and adjust if needed

## Security Testing Requirements

### Authentication Testing
- Verify unauthenticated requests return 401
- Test expired/invalid tokens properly rejected
- Validate user context properly passed to business logic

### Authorization Testing
- Test each role can access appropriate endpoints
- Verify permission denials return 403 with clear messages
- Test edge cases and role boundary conditions

### Audit Logging Testing
- Verify all CRUD operations generate audit logs
- Test audit log content includes all required fields
- Validate audit logs are tenant-isolated

### Rate Limiting Testing
- Test rate limits properly applied per client IP
- Verify rate limit exceeded returns 429
- Test rate limit reset behavior