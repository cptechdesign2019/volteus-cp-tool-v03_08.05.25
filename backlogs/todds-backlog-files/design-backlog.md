# Design & Feature Backlog

This file tracks design improvements and feature ideas to be addressed at a later date.

## UI/UX Enhancements

- [ ] **Login Page Visuals:** Revisit the login page to enhance the overall visual aesthetics.
    - [ ] Add subtle animations to the card and button.
    - [ ] Explore a more dynamic or brand-aligned background instead of a simple gradient.
    - [ ] Refine typography and spacing for a more polished look.

- [ ] **CSV Import Categories Card Text Overflow:** Fix text cutoff issue in import preview
    - [ ] The "Categories" label in the CSV import preview cards is being truncated/hanging off the right side
    - [ ] Affects both `streamlined-csv-import.tsx` and `import-preview.tsx` components
    - [ ] Need to investigate responsive grid layout and card sizing for better text accommodation
    - [ ] Consider alternative layouts or font sizing for better fit
    - **Files affected:** 
      - `src/components/csv/streamlined-csv-import.tsx`
      - `src/components/csv/import-preview.tsx`
    - **Date added:** 2025-01-01

- [ ] **Customer Email Integration from Sidebar:** Add email functionality to customer sidebar
    - [ ] Make customer email addresses clickable in the sidebar drawer
    - [ ] Implement email composition modal/feature directly from sidebar
    - [ ] Allow sending emails to customers without leaving the application
    - [ ] Consider integration with default email client or in-app email composer
    - [ ] Include email templates for common customer communications
    - [ ] Track email history and log communications in customer record
    - **Files affected:**
      - `src/components/customers/customer-sidebar.tsx`
      - New email composition components to be created
    - **Date added:** 2025-01-01

- [ ] **Phone Number Auto-Formatting:** Implement automatic phone number formatting across the application
    - [ ] Add auto-formatting for phone input fields with proper structure: (XXX) XXX-XXXX
    - [ ] Include area code parentheses and hyphen separators automatically as user types
    - [ ] Apply consistent formatting standard to ALL phone number fields throughout the app
    - [ ] Consider input masking library (react-input-mask, react-phone-number-input)
    - [ ] Ensure formatting works for both US and international numbers if needed
    - **Files affected:**
      - All components with phone input fields (customers, quotes, contacts, etc.)
      - `src/components/customers/customer-sidebar.tsx`
      - `src/components/quotes/quote-setup-wizard.tsx`
      - Future phone input components
    - **Priority:** Medium
    - **Date added:** 2025-08-02

- [ ] **Address Auto-Complete Integration:** Implement Google Maps API address auto-fill functionality
    - [ ] Integrate Google Maps Places API or solid alternative (e.g., Mapbox, Here API)
    - [ ] Add address auto-complete/auto-populate as users type in address fields
    - [ ] Apply consistent address input standard across ALL address fields in the app
    - [ ] Include validation for complete addresses (street, city, state, zip)
    - [ ] Consider address normalization and standardization
    - [ ] Ensure mobile-friendly address selection interface
    - **Files affected:**
      - All components with address input fields
      - `src/components/customers/customer-sidebar.tsx`
      - `src/components/quotes/quote-setup-wizard.tsx`
      - Future address input components
    - **Priority:** High (improves data quality and UX significantly)
    - **Date added:** 2025-08-02

- [ ] **Quote Builder Card Header Styling:** Improve visual appearance of section card headers
    - [ ] Redesign card headers to look less like plain strips
    - [ ] Enhance header styling with better visual hierarchy and aesthetics
    - [ ] Consider gradient backgrounds, subtle shadows, or improved typography
    - [ ] Apply consistent header styling across all quote builder sections
    - [ ] Ensure headers integrate well with overall quote builder design
    - **Files affected:**
      - `src/components/quotes/equipment-tab-vertical.tsx`
      - `src/components/quotes/quote-builder-tabs.tsx`
      - Future quote builder section components
    - **Priority:** Medium (visual enhancement)
    - **Date added:** 2025-01-30

- [ ] **Quote Summary Statistics Enhancement:** Add more comprehensive stats and information to quote summary
    - [ ] Expand quote summary section in equipment tab with additional relevant metrics
    - [ ] Consider adding equipment count, total weight, power requirements, installation time estimates
    - [ ] Include profit margin indicators, cost breakdowns, or markup percentages
    - [ ] Add visual indicators for quote completeness or missing information
    - [ ] Ensure summary information is relevant and useful for quote management
    - [ ] Make summary responsive and visually appealing
    - **Files affected:**
      - `src/components/quotes/equipment-tab-vertical.tsx`
      - Quote summary/calculation components
    - **Priority:** Low (nice-to-have enhancement)
    - **Date added:** 2025-01-30

- [ ] **Labor Template System:** Create preset labor packages for common project scenarios
    - [ ] Implement template-based labor estimation (e.g., "Standard Camera Installation" = 2 hrs Programming + 4 hrs Installation)
    - [ ] Create customizable templates for different project types (residential vs commercial)
    - [ ] Add template management interface for creating, editing, and organizing labor templates
    - [ ] Include team composition recommendations in templates
    - [ ] Allow templates to auto-populate based on equipment selected
    - [ ] Create template categories by specialization or project complexity
    - **Files affected:**
      - `src/components/quotes/labor-tab.tsx`
      - New template management components
      - Database schema for labor templates
    - **Priority:** Low (future enhancement)
    - **Date added:** 2025-01-30

- [ ] **Quote Setup Wizard Input Field Sizing:** Optimize input field widths for better UX
    - [ ] Resize oversized input fields to appropriate widths based on expected content
    - [ ] Tax percentage, shipping percentage fields currently too wide
    - [ ] Customer selection, quote title, description fields need proper sizing
    - [ ] Ensure consistent field sizing standards across wizard steps
    - [ ] Apply responsive design principles for mobile/tablet views
    - [ ] Consider using CSS classes like `max-w-xs`, `max-w-sm`, `max-w-md` appropriately
    - **Files affected:**
      - `src/components/quotes/quote-setup-wizard.tsx`
      - Future form components in quote system
    - **Priority:** Low (cosmetic improvement)
    - **Date added:** 2025-08-02

## Future Authentication Options

- [ ] **Google OAuth Login:** Re-enable and finish configuration for Google sign-in once the hosted Supabase project is fully set up.
