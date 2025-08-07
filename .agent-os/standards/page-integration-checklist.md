# Page Integration Checklist

This checklist ensures consistent styling and functionality when integrating new pages from Todd's codebase into Volteus foundation.

## 🎯 **Pre-Integration Analysis**

- [ ] **Identify Todd's original layout system** (AppLayout vs custom wrapper)
- [ ] **Catalog all component dependencies** used in the page
- [ ] **Check for missing UI components** (Radix, shadcn/ui)
- [ ] **Identify custom hooks and API functions** needed
- [ ] **Note any React Query / state management** requirements

## 🏗️ **Layout Standardization**

- [ ] **Convert to Volteus layout pattern**:
  ```tsx
  // Standard Volteus page structure
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar userRole={profile?.role} userEmail={user.email} />
    <div className="flex-1 ml-64 transition-all duration-300">
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page content */}
        </div>
      </main>
    </div>
  </div>
  ```

- [ ] **Add authentication check**:
  ```tsx
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  ```

- [ ] **Remove Todd's AppLayout imports** and replace with Volteus structure

## 🧩 **Component Dependencies**

### Essential UI Components Checklist:
- [ ] `Card`, `CardContent`, `CardHeader`, `CardTitle` from `@/components/ui/card`
- [ ] `Button` from `@/components/ui/button` 
- [ ] `Input` from `@/components/ui/input`
- [ ] `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `@/components/ui/select`
- [ ] `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `@/components/ui/table`
- [ ] `Badge` from `@/components/ui/badge`
- [ ] `Skeleton` from `@/components/ui/skeleton`
- [ ] `Alert`, `AlertDescription` from `@/components/ui/alert`
- [ ] `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog`
- [ ] `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetClose` from `@/components/ui/sheet`
- [ ] `Separator` from `@/components/ui/separator`
- [ ] `ScrollArea` from `@/components/ui/scroll-area`

### Required Dependencies:
- [ ] `@radix-ui/react-dialog`
- [ ] `@radix-ui/react-scroll-area` 
- [ ] `@radix-ui/react-select`
- [ ] `@radix-ui/react-separator`
- [ ] `@tanstack/react-query` (for data fetching)
- [ ] `class-variance-authority` (for variants)

## 🎨 **Styling Standards**

- [ ] **Apply Clearpoint brand colors**:
  - Primary: `#162944` 
  - Use via `style={{ color: '#162944' }}` for key headings
  
- [ ] **Use Volteus global CSS classes**:
  - Background: `bg-gray-50` for page background
  - Cards: `bg-white rounded-lg shadow-sm border border-gray-200`
  - Text hierarchy: `text-gray-900`, `text-gray-600`, `text-gray-500`

- [ ] **Remove Todd's custom styling** that conflicts with Volteus
- [ ] **Ensure responsive behavior** with proper grid/flex classes
- [ ] **Maintain consistent spacing** with Tailwind scale (p-4, p-6, p-8, mb-4, etc.)

## 🔗 **Functionality Integration**

- [ ] **Create stub hooks** initially for testing (useCustomerStats, useCustomerSearch, etc.)
- [ ] **Create stub API functions** for basic functionality
- [ ] **Comment out React Query** calls initially, re-enable after testing
- [ ] **Verify all imports** resolve correctly
- [ ] **Test basic page render** without errors

## 🧪 **Testing & Validation**

- [ ] **Page loads without errors** ✅
- [ ] **Sidebar appears correctly** ✅  
- [ ] **No yellow background or wonky CSS** ✅
- [ ] **All interactive elements** render properly
- [ ] **Responsive design** works on mobile/tablet
- [ ] **Loading states** display appropriately
- [ ] **Error boundaries** handle failures gracefully

## 📋 **Follow-up Tasks**

- [ ] **Re-enable React Query** after initial testing
- [ ] **Connect real data sources** (database, API calls)
- [ ] **Implement missing modal functionality**
- [ ] **Add proper error handling**
- [ ] **Optimize performance** if needed
- [ ] **Add accessibility features** (ARIA labels, keyboard nav)

## 🚀 **Success Criteria**

A page is successfully integrated when:
- ✅ Uses Volteus layout with proper sidebar
- ✅ Matches Clearpoint visual brand standards  
- ✅ All components render without missing dependencies
- ✅ Interactive elements work as expected
- ✅ Responsive design functions properly
- ✅ Performance is acceptable
- ✅ No console errors or warnings

---

**Remember**: Prioritize getting the layout and styling right first, then add back functionality incrementally. This systematic approach prevents the "yellow page" and missing sidebar issues.