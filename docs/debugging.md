# Debugging & Troubleshooting Guide

This handbook is designed to help engineers identify, isolate, and resolve issues in the Office Presence Tracker rapidly.

## 1. Authentication Issues

**Symptom:** User submits login form, button spins indefinitely, but no navigation occurs.
**Root Cause:** An exception occurred inside the Server Action, and the client failed to catch the redirect. Alternatively, the client router cached the unauthenticated state.
**Debugging Steps:**
1. Check the Network tab in DevTools. Look for the POST request to the Server Action. Did it return a `500` or a `{ success: true }` payload?
2. If it returned a `500`, check the Vercel/Node.js server logs for Prisma connection issues or Supabase authentication errors.
3. If it succeeded but navigation failed, ensure `window.location.href` is being executed in `components/auth/login-form.tsx`.
**Permanent Fix:** Ensure server actions always return a structured JSON response (`{ error: string }` or `{ success: true }`) rather than throwing exceptions.

**Symptom:** User is redirected to `/login` immediately after successful login.
**Root Cause:** Middleware (`lib/supabase/middleware.ts`) failed to read the session cookies, or the cookies were not set on the correct domain.
**Debugging Steps:**
1. Check Application > Cookies in DevTools. Is the `sb-xxx-auth-token` present?
2. Ensure `NEXT_PUBLIC_SUPABASE_URL` is identical across client and server environments.

## 2. "Mark Remote" Toggle Issues

**Symptom:** Toggling presence shows "Marked as Remote", but upon page refresh, it reverts to "Office".
**Root Cause:** The optimistic UI update succeeded, but the Server Action failed silently or the database connection timed out.
**Debugging Steps:**
1. Inspect the Vercel Server Logs for Prisma errors (e.g., `P2002` unique constraint violation or connection pool exhaustion).
2. Check if the `revalidatePath` call executed successfully.

**Symptom:** "Mark Remote" is extremely slow (taking 2+ seconds).
**Root Cause:** The `revalidatePath` function is forcing Next.js to synchronously rebuild the entire dashboard page, which involves multiple heavy database queries, before returning the response.
**Debugging Steps:**
1. Verify `presence-actions.ts` is only calling `revalidatePath` for the specific route the user is currently on (e.g., `/dashboard/presence` vs `/admin/presence`).
2. Analyze the database queries running during the page load using Prisma Studio or Supabase Dashboard.

## 3. Database & Prisma Issues

**Symptom:** Build fails on Vercel with `PrismaClientInitializationError: Prisma has detected that this project was built on Vercel...`
**Root Cause:** Vercel caches `node_modules` between builds. The Prisma Client generated in the previous build may be stale or missing entirely.
**Debugging Steps:**
1. Check `package.json`.
2. **Permanent Fix:** Ensure the build script is exactly `"build": "prisma generate && next build"`.

## 4. Production Support Guide

**Emergency Debugging Checklist:**
1. **Check Supabase Status:** Is the database paused or experiencing downtime?
2. **Check Vercel Logs:** Are there frequent `500 Internal Server Error` responses? Filter logs by `error` keyword.
3. **Check Environment Variables:** Did a recent deployment overwrite or delete `DATABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`?

**Log Tracing:**
- **Frontend Errors:** Look for React Error Boundary fallbacks in the UI. Open browser console for hydration errors.
- **Backend Errors:** Navigate to Vercel Project > Logs. Filter by "Function" or "Edge". Look for stack traces originating from `lib/actions/`.

## 5. Global Error Handling Strategy

- **API/Server Actions:** Wrapped in `try/catch` blocks. Errors are caught and returned as `{ error: 'User friendly message' }`.
- **Frontend Forms:** Uses `sonner` toast notifications to display the returned `{ error }` strings gracefully to the user.
- **Middleware:** Unauthenticated requests to protected routes gracefully redirect via `NextResponse.redirect()` rather than throwing `401` exceptions.
