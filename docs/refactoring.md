# Refactoring & Optimization Recommendations

This document provides actionable recommendations to improve performance, maintainability, and code quality across the Office Presence Tracker.

## 1. Performance Analysis & Optimization

### Current Bottlenecks
- **Duplicate Renders on Calendar Navigation:** In `dashboard-client.tsx`, clicking "Next Month" updates state and forces a massive re-render of 30+ `TogglePresence` components simultaneously. 
- **Server Action Latency:** Even with targeted `revalidatePath`, server actions block the UI from finalizing state transitions until the network roundtrip completes.

### Refactoring Strategies
1. **Virtualization:** For the Admin Dashboard "List View", implement virtual scrolling (e.g., `@tanstack/react-virtual`) to only render rows that are currently visible on screen. This will prevent DOM bloat when the company scales beyond 50 employees.
2. **Move to SWR / React Query:** Instead of relying entirely on Next.js Server Components for dynamic data fetching (which requires `revalidatePath`), fetch calendar data client-side using a caching library like React Query or SWR. This allows background refetching and significantly reduces the TTFB (Time to First Byte) on mutations.
3. **Memoization:** Wrap the calendar day cells in `React.memo` to prevent them from re-rendering unless their specific `date` or `isRemote` status changes.

## 2. Architecture & Code Quality Improvements

### Dead Code & Dependency Cleanup
- **Remove Duplicate Password Logic:** The application manually stores passwords in Prisma. Remove this entirely and rely solely on Supabase Auth.
- **Component Extraction:** `dashboard-client.tsx` is over 350 lines long and handles tabs, month generation math, password updates, and API calls. 
  - **Suggestion:** Extract the date math into `lib/utils/date.ts`. Extract the Settings Dialog into a dedicated `<UpdatePasswordDialog />` component. Extract the Calendar views into `<MonthView />`, `<WeekView />`, etc.

### Naming Conventions
- Standardize database access patterns. Instead of calling `prisma...` directly inside Server Actions scattered across the `lib/actions` folder, create a Data Access Layer (DAL). For example, `lib/services/presence.service.ts` which exports `markUserRemote(userId, date)`. This improves testing and decoupling.

## 3. Testing Strategy Review

Currently, there are no robust testing frameworks visible in the `package.json` (no Jest, Vitest, Cypress, or Playwright).

### Recommended Testing Architecture
1. **Unit Testing (Vitest + React Testing Library):**
   - Test utility functions (`getDaysInMonth`, `formatDateStr`).
   - Test isolated UI components (ensure `TogglePresence` renders correctly based on the `isRemote` prop).
2. **Integration Testing:**
   - Mock Prisma and Supabase using `vitest-mock-extended`.
   - Test Server Actions (`toggleRemoteStatus`) to verify they query/delete from Prisma correctly.
3. **End-to-End Testing (Playwright):**
   - **Critical Regression Scenarios:**
     - Admin logs in, invites a new user, and verifying the user appears in the roster.
     - Employee logs in, clicks "Mark Remote" for tomorrow, verifies the toast appears, and refreshes the page to ensure the state persisted.
     - Attempting to access `/admin/presence` as a normal employee redirects them.

### Coverage Gaps
- **Middleware Logic:** Middleware redirects are notoriously difficult to test and prone to silent failures. They must be heavily covered in E2E tests to ensure users are never trapped in redirect loops.
