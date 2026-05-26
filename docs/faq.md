# FAQ & Knowledge Base

This document serves as a quick reference for technical and architectural questions regarding the Office Presence Tracker.

## Frequently Asked Technical Questions

### Q: Why do we use Next.js Server Actions instead of API Routes (`/api/`)?
**A:** Server Actions allow us to define async functions on the server that can be called directly from React components without having to manually fetch data, serialize JSON, or manage API endpoints. It drastically reduces boilerplate and ensures end-to-end type safety since both client and server share the same TypeScript environment.

### Q: Why do we have to use `window.location.href` on login instead of `router.push()`?
**A:** When authenticating via Supabase SSR, cookies are set by the server. If we use Next.js's client-side router (`router.push()`), the router might attempt to use cached layout data that was generated before the cookies were set. This can result in the user being stuck on a blank page or redirected back to login until they manually refresh. `window.location.href` forces the browser to request a fresh HTML document, ensuring the Next.js middleware reads the new cookies correctly.

### Q: How does the Optimistic UI for toggling presence work?
**A:** When an employee clicks "Mark Remote", we immediately update the local React state (changing the button text and color) before the server has even responded. We wrap the actual server request in a `startTransition`. If the server request succeeds, the state remains. If it fails, we catch the error, show a toast notification, and automatically revert the button to its previous state. This makes the application feel instantly responsive.

### Q: Why is `prisma generate` in the build script?
**A:** Vercel caches the `node_modules` directory across deployments to save time. Since the Prisma Client is generated inside `node_modules/@prisma/client`, a cached deployment might lack the generated client for a newly deployed schema. Running `prisma generate` before `next build` ensures the generated code exactly matches the current `schema.prisma` file.

### Q: Why does `toggleRemoteStatus` require `isCurrentlyRemote` as an argument?
**A:** Originally, the server had to execute a database query (`findUnique`) to determine if a remote entry already existed before deciding whether to `create` or `delete` it. By passing `isCurrentlyRemote` from the client (which already knows the current state), we bypass the read query entirely and directly issue a write query, cutting the database workload in half and improving performance.

### Q: How do we prevent normal employees from accessing the Admin Dashboard?
**A:** We use a two-tiered security model. 
1. **Middleware Level:** `lib/supabase/middleware.ts` intercepts all requests to `/admin`. It reads the user's role from the database. If they are not an admin, they are forcefully redirected to `/dashboard/presence`.
2. **Server Action Level:** Any server action restricted to admins (like `inviteMember` or `deleteProfile`) re-verifies the user's role independently before executing. Even if a user bypasses the frontend, the backend will reject the action.

## Real Debugging Example

**Scenario:** An employee complains they cannot log in. They click "Sign In", the button spins, and then stops, but nothing happens. No error is shown.
**Investigation Steps:**
1. Open the Developer Tools -> Network Tab.
2. Attempt to log in again.
3. Observe the network request to the Next.js Server Action. It returns a `200 OK` status, but the payload contains: `{"error": "Invalid login credentials"}`.
4. The issue is that the error is being swallowed on the frontend.
5. Check `login-form.tsx`. Ensure the `try/catch` block correctly invokes `toast.error(result.error)`.
6. Ensure the `sonner` Toaster component is actually mounted in `app/layout.tsx`. If the Toaster is missing from the root layout, the `toast.error()` call will execute silently without rendering anything on the screen.
