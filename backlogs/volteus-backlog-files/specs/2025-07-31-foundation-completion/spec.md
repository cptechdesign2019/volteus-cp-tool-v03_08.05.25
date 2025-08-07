# Spec Requirements Document

> Spec: Foundation Completion & User Management  
> Created: 2025-07-31  
> Status: Planning  

## Overview

Complete the foundational infrastructure and user management system for Volteus by implementing remaining core features: avatar uploads, profile management, admin interfaces, and comprehensive API security. This spec finalizes the "plumbing" before building business-specific features, ensuring a professional and secure user experience.

## User Stories

### Profile Management
- *As any User, I want to upload a profile picture so that my account feels personalized and colleagues can recognize me.*
- *As any User, I want to edit my profile information so that I can keep my contact details current.*
- *As any User, I want to change my password so that I can maintain account security.*

### Admin User Management  
- *As a Super Admin, I want to see all team members so that I can manage our organization.*
- *As a Super Admin, I want to change user roles so that I can grant appropriate permissions.*
- *As a Super Admin, I want to invite new team members so that we can onboard staff efficiently.*
- *As a Super Admin, I want to deactivate users so that former employees can't access the system.*

### System Settings
- *As a Super Admin, I want to update company information so that quotes and documents reflect current branding.*
- *As a Super Admin, I want to manage labor rates so that pricing stays current with market conditions.*
- *As a Business Owner, I want to see an audit log so that I can track important system changes.*

### Security & Permissions
- *As a Developer, I want all API endpoints secured so that users can only access their permitted data.*
- *As a Business Owner, I want role-based restrictions enforced everywhere so that sensitive information stays protected.*

## Spec Scope

### In Scope
1. **Avatar Upload System**
   - Supabase Storage integration for image files
   - Client-side image preview and cropping
   - Automatic resizing and optimization
   - Avatar display throughout the application
   - Fallback to initials when no avatar present

2. **Profile Settings Page**
   - Personal information editing (name, email, phone)
   - Password change functionality
   - Avatar upload interface
   - Account preferences and settings
   - Delete account option (with confirmation)

3. **Admin User Management**
   - User list page with search and filtering
   - Role assignment interface
   - User invitation system with email notifications
   - User activation/deactivation controls
   - Bulk user operations (role changes, exports)

4. **Company Settings Management**
   - Company information editor (name, address, branding)
   - Labor rates management with effective dates
   - Email template customization
   - System configuration options
   - Audit log viewer with filtering

5. **API Security Enhancement**
   - Role-based permission checks on all endpoints
   - Tenant isolation verification
   - Rate limiting and abuse prevention
   - Comprehensive error handling and logging
   - API key management for future integrations

### Out of Scope
- **Multi-factor authentication** (planned for security enhancement spec)
- **Single sign-on (SSO)** (planned for enterprise spec)
- **Advanced audit analytics** (planned for reporting spec)
- **Custom role creation** (using predefined roles only)

## Technical Implementation

### Database Schema Updates
```sql
-- Add avatar support to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN avatar_url TEXT,
ADD COLUMN avatar_storage_path TEXT;

-- Company settings table enhancement
ALTER TABLE company_settings 
ADD COLUMN logo_url TEXT,
ADD COLUMN logo_storage_path TEXT;

-- Audit log table (if not exists)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
  resource_type TEXT NOT NULL, -- 'user', 'company_settings', 'lead', etc.
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supabase Storage Setup
```javascript
// Storage bucket for avatars
const { data, error } = await supabase
  .storage
  .createBucket('avatars', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 2097152 // 2MB
  })
```

### API Endpoints
```typescript
// Profile management
GET    /api/profile                 // Get current user profile
PUT    /api/profile                 // Update profile information
POST   /api/profile/avatar          // Upload avatar image
DELETE /api/profile/avatar          // Remove avatar
PUT    /api/profile/password        // Change password

// Admin user management
GET    /api/admin/users             // List all tenant users
POST   /api/admin/users/invite      // Invite new user
PUT    /api/admin/users/[id]/role   // Update user role
PUT    /api/admin/users/[id]/status // Activate/deactivate user
DELETE /api/admin/users/[id]        // Delete user account

// Company settings
GET    /api/admin/company           // Get company settings
PUT    /api/admin/company           // Update company settings
POST   /api/admin/company/logo     // Upload company logo
GET    /api/admin/labor-rates       // Get labor rates
PUT    /api/admin/labor-rates       // Update labor rates

// Audit logs
GET    /api/admin/audit-logs        // Get audit log entries
```

### Permission Matrix
```typescript
const permissions = {
  technician: {
    profile: ['read', 'update'],
    avatar: ['upload', 'delete_own'],
    password: ['change_own']
  },
  lead_technician: {
    ...technician,
    team: ['view_profiles']
  },
  sales_rep: {
    ...technician,
    customers: ['read', 'create', 'update'],
    quotes: ['read', 'create', 'update']
  },
  project_manager: {
    ...sales_rep,
    projects: ['read', 'create', 'update', 'assign'],
    team: ['view_profiles', 'assign_tasks']
  },
  super_admin: {
    '*': ['*'], // Full access to everything
    users: ['create', 'read', 'update', 'delete', 'invite'],
    company: ['read', 'update'],
    audit: ['read'],
    system: ['configure']
  }
}
```

## User Interface Components

### 1. Profile Settings Page (`/settings/profile`)
- **Header**: "Profile Settings" with breadcrumb navigation
- **Avatar Section**: Large avatar display with upload/change button
- **Personal Info**: Form with name, email, phone, title fields
- **Security**: Change password section with validation
- **Danger Zone**: Delete account option with confirmation modal

### 2. Admin User Management (`/admin/users`)
- **Header**: "User Management" with invite button
- **User Table**: Name, email, role, status, last login, actions
- **Bulk Actions**: Role assignment, status changes, export
- **Search/Filter**: By name, role, status, last login date
- **Invite Modal**: Email input with role selection

### 3. Company Settings (`/admin/company`)
- **Company Info**: Name, address, phone, website
- **Branding**: Logo upload with preview
- **Labor Rates**: Table with role, rate, effective date
- **Email Templates**: Customizable templates for system emails
- **System Config**: Timezone, date format, currency settings

### 4. Audit Log Viewer (`/admin/audit-logs`)
- **Filter Controls**: Date range, user, action type, resource
- **Log Table**: Timestamp, user, action, resource, details
- **Detail Modal**: Full change details in readable format
- **Export**: CSV download for compliance requirements

## Success Metrics

### Functional Requirements
- [ ] Users can upload and update profile avatars seamlessly
- [ ] Profile settings page allows complete profile management
- [ ] Super admins can manage all tenant users effectively
- [ ] Company settings are editable by authorized users
- [ ] All API endpoints properly enforce role permissions
- [ ] Audit logging captures all significant system changes

### Security Requirements
- [ ] No user can access data outside their tenant
- [ ] Role restrictions prevent unauthorized actions
- [ ] Password changes require current password verification
- [ ] File uploads are validated and size-limited
- [ ] API rate limiting prevents abuse

### User Experience Requirements
- [ ] Avatar uploads complete in under 10 seconds
- [ ] Profile updates save without page refresh
- [ ] Admin interfaces are intuitive and efficient
- [ ] Error messages are clear and actionable
- [ ] Mobile-responsive design for all new pages

## Dependencies

- **Foundation & Security Spec**: Core authentication and database
- **Supabase Storage**: File upload and management capabilities
- **Existing Dashboard**: Navigation and layout patterns

## Risk Mitigation

- **File Upload Security**: Validate file types, scan for malware, limit sizes
- **Performance**: Optimize image processing and storage
- **Data Privacy**: Ensure GDPR compliance for user data management
- **Backup**: Automated backups of user data and settings

## Implementation Timeline

**Week 1**: Avatar upload system and profile settings  
**Week 2**: Admin user management interface  
**Week 3**: Company settings and audit logging  
**Week 4**: API security enhancement and testing  
**Week 5**: Polish, documentation, and final validation

## Future Enhancements

1. **Advanced Security**
   - Multi-factor authentication
   - Session management improvements
   - Advanced audit analytics

2. **User Experience**
   - Bulk user import from CSV
   - Advanced role customization
   - Real-time notifications

3. **Enterprise Features**
   - Single sign-on integration
   - Advanced company branding
   - Compliance reporting tools