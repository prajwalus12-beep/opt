# Risk Assessment & Security Review

This document identifies potential security vulnerabilities, fragile modules, and known risks within the Office Presence Tracker.

## 1. Security Review & Vulnerabilities

### High Risk: Plaintext Password Storage Anti-Pattern
**Description:** The application stores passwords in the `profiles` table within the Prisma schema (`password String?`). When a user is invited or updates their password, the raw password string is saved to the database. Additionally, it is rendered in plain text (though masked behind a toggle) in the Admin Roster View.
**Risk Level:** **CRITICAL**
**Vulnerability:** If the database is compromised, all user passwords are exposed in plaintext. Supabase Auth hashes passwords internally, but duplicating and storing them unhashed in a custom table completely undermines this security mechanism.
**Recommendation:** Remove the `password` column from the `profiles` table. Admins do not need to view employee passwords. If admins need to reset a user's password, they should use a password reset link mechanism via Supabase, rather than setting and viewing a static password.

### Medium Risk: Admin Role Escalation via API
**Description:** While `inviteMember` checks if the invoker is an admin, it accepts a `role` parameter. If validation on this role is weak or bypassed in other flows, a user might elevate their privileges.
**Risk Level:** Medium
**Recommendation:** Enforce strict enum types for `role` at the Prisma level (`enum Role { admin, employee }`) rather than using raw strings. 

### Medium Risk: Lack of Rate Limiting on Server Actions
**Description:** Authentication and presence toggling Server Actions do not have rate limiting. 
**Risk Level:** Medium
**Vulnerability:** A malicious actor could spam the `toggleRemoteStatus` action, causing excessive database writes and exhausting the Supabase connection pool.
**Recommendation:** Implement rate limiting (e.g., using Upstash Redis or Vercel Edge Middleware) for authentication endpoints and heavy mutations.

## 2. Known Risks & Future Issues

### Scalability Bottlenecks
- **`revalidatePath` Usage:** The application currently relies on `revalidatePath` to synchronize state. While we optimized this to only target specific paths, it still forces the server to do a full page re-render. As the user base grows (e.g., 500+ employees), re-rendering the admin dashboard on every presence toggle will become extremely slow.
- **Data Fetching:** In `getAllPresence`, there is no pagination. Rendering a calendar for hundreds of employees simultaneously will eventually crash the browser or hit Supabase query timeout limits.

### Fragile Modules
- **Client-Side Routing on Login:** If `window.location.href` fails or if the application transitions to a PWA (Progressive Web App), full page reloads for authentication might break offline functionality or disrupt the SPA experience.
- **Next.js Middleware:** The `middleware.ts` is extremely critical. Any unhandled exception in `updateSession` will crash the entire routing layer, effectively bringing down the application.

### State Synchronization Issues
- **Optimistic UI De-sync:** If a user opens the app in two tabs, toggling presence in one tab will not update the other tab until a full page refresh occurs. Real-time subscriptions (via Supabase Realtime) are missing.
