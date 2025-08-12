# Project Backlog – Priority

> This backlog collects tasks we intentionally defer so we can keep primary feature delivery moving.  Each item is high-priority and should be returned to once the core functionality is stable.

---

### ⚠️  Resolve Product-API Unit-Test Suite (Critical)
* **Context**: Product Data Management API unit-tests currently show **19 / 23** passing.  Failures are limited to mock-layer wiring (Supabase chain) — production code is unaffected.
* **Why deferred**: Focusing next on Task 4 (Product Library UI).  The failing tests do **not** block UI integration or live data flow.
* **Acceptance**:
  1. All 23 unit-tests green (`22 passed, 0 failed` after suite consolidation).
  2. Supabase mock utility updated to mirror real query chains (`select → order/range → single`).
  3. Test cases validate brand/category filters, distinct list helpers, and malformed-response branch without artificial `.then()` hacks.
* **Owner**: Dev team (re-assign once core UI finished).
* **Target revisit**: Immediately after Product Library UI (Spec 05, Task 4) is feature-complete and smoke-tested.


### ⚠️  Complete Product Library UI Test Suite (High)
* **Context**: Product Library component tests are **10 / 13** passing. Remaining failures relate to debounce timing & dynamic filter expectations.
* **Why deferred**: Core UI & filter logic confirmed working manually; test tweaks are non-blocking for upcoming editing features.
* **Acceptance**:
  1. All 13 UI tests green.
  2. Tests cover dynamic brand↔category filter narrowing and pagination footer.
  3. Debounce handled with proper async utilities.
* **Owner**: Dev team – address after Task 6 implementation.
* **Target revisit**: After Product Editing & Management feature (Spec 05, Task 6).

### ⚠️  Fix Product Editing Test Suite (Medium)
* **Context**: Product editing component tests are **0 / 12** passing. Tests fail to find edit/delete buttons due to icon class name mismatches.
* **Why deferred**: Core editing functionality works in browser; test selector issues are non-blocking for feature delivery.
* **Acceptance**:
  1. All 12 editing tests green.
  2. Button selectors updated to match actual rendered HTML.
  3. Modal interaction tests properly handle async state.
* **Owner**: Dev team – address after Task 7 implementation.
* **Target revisit**: After CSV Import Integration & Polish (Spec 05, Task 7).

### ⚠️  Product Library: Display Product Images in Search Results (High)
* **Context**: Product Library search results currently show text-only information but the `image_url` field exists in the database and could significantly improve UX by showing product visuals.
* **Why deferred**: Core search/filter functionality is working; focusing on completing fundamental CRUD operations before visual enhancements.
* **Acceptance**:
  1. Product search results display thumbnail images when `image_url` is available.
  2. Graceful fallback to placeholder/icon when no image URL exists.
  3. Images are properly sized and styled to fit the table layout.
  4. Images load efficiently with proper error handling for broken URLs.
  5. Optional: Hover/click to view larger image preview.
* **Owner**: Dev team.
* **Target revisit**: After core Product Library CRUD operations are stable.
* **Business Impact**: MEDIUM - Enhanced visual product identification for users.

### ⚠️  Fix Database Restoration Script (Critical - Production Blocker)
* **Context**: The `restore-critical-data.js` script fails to restore products after database resets, causing persistent empty error objects during insertion. This forces manual re-import of customer/product data after every reset, which is unsustainable for production.
* **Why deferred**: Manual UI-based import works as temporary workaround; focusing on core quote builder functionality to maintain development momentum.
* **Acceptance**:
  1. Script successfully restores all customer accounts, contacts, and products without errors.
  2. Handles special characters, long URLs, and complex product data properly.
  3. Uses proper conflict resolution (UPSERT with correct keys).
  4. Includes comprehensive error reporting and data validation.
  5. Works reliably with service role permissions and bypasses RLS issues.
* **Owner**: Dev team (critical for production deployment).
* **Target revisit**: Before production launch - this must be 100% operational for live environment.
* **Production Impact**: HIGH - Data loss protection is essential for business continuity.

---

_Added **August 3, 2025** by AI assistant at user request._