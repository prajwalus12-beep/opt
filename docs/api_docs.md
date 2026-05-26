# Database & API Documentation

## Database Schema (Prisma)

The application relies on a PostgreSQL database with two primary entities: `Profile` and `RemoteWorkEntry`.

### `Profile` (profiles)
Stores user information and roles.
- `id` (String / UUID): Primary Key. Maps to Supabase Auth `auth.users.id`.
- `full_name` (String): User's full name.
- `email` (String): Unique identifier.
- `avatar_url` (String?): Optional avatar image URL.
- `role` (String): Role of the user, defaults to `"employee"`. Can be `"admin"`.
- `password` (String?): Stores a copy of the password (anti-pattern, noted in Risk Report).
- `created_at` (DateTime): Timestamp of creation.

### `RemoteWorkEntry` (remote_work_entries)
Tracks which days a user works remotely. If no entry exists for a user and date, they are assumed to be in the office.
- `id` (String / UUID): Primary Key.
- `user_id` (String / UUID): Foreign key to `Profile.id`.
- `work_date` (DateTime): The exact day (stored as `db.Date` / normalized to start of day) they are remote.
- `created_at` / `updated_at` (DateTime): Timestamps.

**Relationships:**
- A `Profile` has a one-to-many relationship with `RemoteWorkEntry` (`profile.remote_work_entries`).
- A compound unique constraint exists on `[user_id, work_date]` to ensure a user cannot have duplicate remote entries for the same day.

---

## Server Actions Reference (API Equivalents)

Because the application uses Next.js App Router, traditional REST endpoints (`/api/...`) are not used. Instead, data mutations occur via Server Actions.

### Authentication Actions (`lib/actions/auth-actions.ts`)

| Action | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `loginEmployee` | `formData: FormData` | `{ success?: true, redirectTo?: string, error?: string }` | Validates credentials against Supabase. Redirects to `/dashboard/presence` if successful. |
| `loginAdmin` | `formData: FormData` | `{ success?: true, redirectTo?: string, error?: string }` | Validates credentials, checks if `role === 'admin'`. Fails if unauthorized. Redirects to `/admin/presence`. |
| `logout` | None | `redirect()` | Clears session cookies and redirects to `/login`. |

### Presence & Admin Actions (`lib/actions/presence-actions.ts`)

| Action | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `toggleRemoteStatus` | `date: Date`, `isCurrentlyRemote: boolean`, `userId?: string` | `{ success: boolean, error?: string }` | Creates or deletes a `RemoteWorkEntry` for a given date. Triggers `revalidatePath` for the relevant dashboard. |
| `inviteMember` | `email`, `fullName`, `password?`, `role` | `{ success: boolean, error?: string }` | **Admin Only.** Uses Supabase Admin API to bypass email confirmation and forcefully create an auth user, then creates the Prisma Profile. |
| `updateUserPassword` | `password: string` | `{ success: boolean, error?: string }` | Updates the logged-in user's Supabase Auth password and syncs it to the Prisma profile. |
| `deleteProfile` | `profileId: string` | `{ success: boolean, error?: string }` | **Admin Only.** Deletes a user from Supabase Auth and cascades the deletion to Prisma records. |
| `getEmployeePresence`| `monthStr: string`, `userId?: string` | `string[]` (Array of Dates) | Returns all YYYY-MM-DD strings for a user in a given month where they are marked remote. |
| `getAllPresence` | `startDate: string`, `endDate: string` | `Array<{ work_date, profiles }>` | **Admin Only.** Returns aggregated remote entries for all users within a date range to render the admin dashboard. |

### Validation & Error Flow
1. Client components call Server Actions.
2. Server Actions validate session via `supabase.auth.getUser()`.
3. If unauthenticated or unauthorized, they immediately return `{ error: 'Not authenticated' }`.
4. If a database error occurs, it is caught in a `try/catch` and returned as `{ error: err.message }`.
5. The Client Component reads the JSON response and displays a `toast.error(result.error)`.
