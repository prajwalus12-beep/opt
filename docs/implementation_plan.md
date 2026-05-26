# Implementation Plan - Optimize Login and Mark Remote Performance

We will address the issues with the slow login process, missing loader, navigation failure, and the slow "Mark Remote" functionality. All proposed modifications are minor, highly targeted improvements that do not disrupt the existing architecture.

## Proposed Changes

We will modify four files in a targeted manner to optimize performance and improve the user experience.

---

### Authentication Component & Action

#### [MODIFY] [auth-actions.ts](file:///c:/Unique%20School%20Project/opt/lib/actions/auth-actions.ts)
- Modify `loginEmployee` and `loginAdmin` to return a JSON object `{ success: true, redirectTo: '...' }` instead of using `redirect()` inside the server action. 
- This avoids Next.js Server Action redirect serialization overhead and potential client-side router caching issues where the user is left on the same page until manual refresh.

#### [MODIFY] [login-form.tsx](file:///c:/Unique%20School%20Project/opt/components/auth/login-form.tsx)
- Catch the JSON result returned by the login actions.
- Keep the `loading` state active during the entire login and redirect transition, ensuring the spinner runs continuously.
- Perform a direct browser navigation to the target dashboard using `window.location.href` to completely bypass Next.js client-side router caching bugs, ensuring automatic redirection and eliminating the need for manual refresh.

---

### Presence Action & Component

#### [MODIFY] [presence-actions.ts](file:///c:/Unique%20School%20Project/opt/lib/actions/presence-actions.ts)
- Modify `toggleRemoteStatus` to accept `isCurrentlyRemote` as a parameter:
  ```typescript
  export async function toggleRemoteStatus(date: Date, isCurrentlyRemote: boolean, userId?: string)
  ```
- **Remove DB Query round-trip**: Eliminate the slow `prisma.remoteWorkEntry.findUnique` check entirely. Since the client already knows the current state, we can write directly to the DB (either `create` or `delete`) based on `isCurrentlyRemote`.
- **Targeted Revalidation**: Only call `revalidatePath('/admin/presence')` if an admin is modifying another user's status (`userId` is provided). Otherwise, only call `revalidatePath('/dashboard/presence')` for employees. This prevents heavy, unnecessary server-side re-rendering of the admin dashboard for normal employee toggles.

#### [MODIFY] [toggle-presence.tsx](file:///c:/Unique%20School%20Project/opt/components/presence/toggle-presence.tsx)
- Update `handleToggle` to call `toggleRemoteStatus` with the original remote state:
  ```typescript
  const result = await toggleRemoteStatus(date, originalState, userId)
  ```
- Correct the toast messages logic so it accurately announces the new state (e.g. "Marked as Remote" when checking the box, and "Marked as Office" when unchecking).

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify there are no compilation or typescript errors.

### Manual Verification
- Test login with a test user to verify that the spinner runs and the dashboard redirects automatically.
- Test "Mark Remote" to ensure it toggles instantly with optimized backend response times.
