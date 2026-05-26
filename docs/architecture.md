# Architecture Documentation

## 1. Project Overview

**Purpose:** Office Presence Tracker is a web application designed to track and manage employee office and remote work schedules.

**Business Use Case:** As hybrid work models become standard, organizations need a simple, centralized hub to see who is working remotely and who is in the office on any given day. This facilitates better team collaboration, meeting planning, and office resource management.

**Main Functionalities:**
- **Employee View:** Toggle remote/office status, view personal schedule (Month, Week, Day, List views).
- **Admin View:** Monitor team presence, view aggregated occupancy, manage team roster (add/remove members).
- **Authentication:** Role-based access control (Admin vs. Employee).

**User Flow:**
1. User arrives at `/login` or `/admin/login`.
2. Authenticates via email/password.
3. System checks role (`admin` or `employee`) and routes to `/admin/presence` or `/dashboard/presence`.
4. Users interact with a calendar interface to toggle their remote status. Admins can view everyone and toggle statuses on their behalf.

**High-Level Architecture:**
The application uses a Monolithic Serverless architecture based on Next.js App Router. The frontend (React components) and backend (Server Actions/API) are tightly coupled in the same repository. Database access is handled via Prisma ORM connected to a PostgreSQL database hosted on Supabase, which also handles authentication via JWTs and cookies.

---

## 2. Tech Stack Analysis

- **Frontend Framework:** Next.js 16.2.6 (React 19)
  - *Why:* Provides SSR, optimized routing, and Server Actions for seamless client/server communication.
  - *Best Practices:* Use Server Components by default, Client Components only when interactivity is needed (`'use client'`).
- **Backend Framework:** Next.js (Server Actions)
  - *Why:* Eliminates the need for separate API routes for mutations.
  - *Common Issues:* Server Actions throwing `redirect()` must be handled carefully to avoid unhandled promise rejections on the client.
- **Database:** PostgreSQL (via Supabase)
  - *Why:* Robust relational database.
- **ORM:** Prisma
  - *Why:* Type-safe database queries.
  - *Common Issues:* Vercel caching can cause stale Prisma clients if `prisma generate` isn't run during the build step.
- **State Management:** React `useState`, `useTransition`, and Next.js Server State
  - *Why:* Lightweight and built-in. The app relies heavily on Server State (DB) and optimistic UI updates rather than complex global stores (like Redux).
- **Authentication:** Supabase Auth (`@supabase/ssr`)
  - *Why:* Secure, cookie-based authentication integrated directly into Next.js middleware.
- **Styling:** Tailwind CSS v4 & shadcn/ui
  - *Why:* Utility-first CSS for rapid UI development with accessible, pre-built components.

---

## 3. Folder Structure Review

- **`app/`**: Next.js App Router root.
  - **`(auth)/`**: Route group for login pages (`/login`, `/admin/login`).
  - **`admin/`**: Admin dashboard routes.
  - **`dashboard/`**: Employee dashboard routes.
  - **`layout.tsx` & `page.tsx`**: Root layout and landing page.
- **`components/`**: Reusable React components.
  - **`auth/`**: Login form components.
  - **`presence/`**: Complex client components for the calendars and dashboards (`dashboard-client.tsx`, `admin-dashboard-client.tsx`, `toggle-presence.tsx`).
  - **`ui/`**: Primitive components from shadcn/ui (buttons, inputs, cards).
- **`lib/`**: Core utilities and configuration.
  - **`actions/`**: Next.js Server Actions for mutations (`auth-actions.ts`, `presence-actions.ts`).
  - **`supabase/`**: Supabase client initialization (client, server, and middleware).
  - **`prisma.ts`**: Prisma client singleton instantiation.
- **`prisma/`**: Database schema (`schema.prisma`) and seeding scripts.

---

## 4. Code Flow Explanation

**Authentication Flow:**
1. User submits `<LoginForm />`.
2. Client calls `loginEmployee(formData)` (Server Action).
3. Server Action calls `supabase.auth.signInWithPassword`.
4. Supabase validates credentials and sets secure cookies.
5. Server Action fetches the user's role from Prisma.
6. Server Action returns `{ success: true, redirectTo }`.
7. Client executes `window.location.href = redirectTo` for a clean browser navigation, forcing middleware to read the new cookies.

**Presence Toggle Flow (Optimistic UI):**
1. User clicks "Mark Remote" in `<TogglePresence />`.
2. Client immediately sets `optimisticRemote = true` (UI updates instantly).
3. Client wraps the Server Action call in `startTransition`.
4. `toggleRemoteStatus(date, isCurrentlyRemote, userId)` executes on the server.
5. Server uses the compound unique index (`user_id_work_date`) to immediately create or delete the DB record.
6. Server calls `revalidatePath(...)` to purge the Next.js cache for the specific route.
7. If successful, client shows a success toast. If failed, client reverts `optimisticRemote` to its original state and shows an error toast.

---

## 5. Architecture Design Review

**Patterns Used:**
- **Server Actions:** Replaces traditional REST API controllers.
- **Optimistic UI:** Updating state before server confirmation for a snappy UX.
- **Singleton Pattern:** Prisma client instantiated once in `lib/prisma.ts` to prevent connection exhaustion in dev mode.

**Scalability & Maintainability:**
- *Pros:* Highly modular UI (`shadcn/ui`), excellent type safety across the stack, secure auth via middleware.
- *Cons:* Tightly coupled monolithic design. Server Actions mix business logic and routing logic.
- *Technical Debt:* Revalidating entire paths on every toggle can be heavy on the server if the user base grows significantly.

---

## 7. State Management Deep Analysis

- **Global State:** Minimal. The application relies on the Server as the source of truth.
- **Local State:** Managed via `useState` inside Client Components (e.g., current calendar view, selected date, optimistic toggle status).
- **Data Synchronization:** Achieved via Next.js `revalidatePath()`. When a mutation occurs, the server forces the client to refetch the server-rendered page layout.

---

## 8. UI/UX and Frontend Analysis

- **Responsive Design:** Utilizes Tailwind CSS grid and flexbox utilities. The calendar view adapts gracefully to mobile by switching to a card-based week/day view.
- **Accessibility:** Built on Radix UI (via shadcn), ensuring proper ARIA roles and keyboard navigation.
- **Optimization:** Heavy UI components (calendars) are isolated as Client Components, while data fetching happens securely in Server Components.

---

## 14. DevOps & Deployment

- **Deployment Platform:** Vercel (Optimized for Next.js).
- **Build Pipeline:** `npm run build` relies on `prisma generate && next build`. This guarantees the Prisma client is correctly constructed for the Vercel edge/serverless environment.
- **Environment Configurations:** Managed via Vercel Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `DATABASE_URL`, etc.).
- **Database:** Supabase handles connection pooling (pgbouncer) to ensure serverless functions do not exhaust DB connections.
