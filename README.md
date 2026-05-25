# Office Presence Tracker

A modern Next.js application for tracking team office presence and remote work days, powered by Supabase and Prisma.

## Prerequisites

- [Node.js 18+](https://nodejs.org/)
- A [Supabase](https://supabase.com/) account and project
- Supabase CLI (optional, for local development)

## Getting Started

### 1. Clone the repository and install dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# Supabase API (found in Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Database Connection (found in Project Settings > Database > Connection strings > URI)
# Make sure to use the 'Transaction Pooler' (port 6543) or 'Session Pooler' (port 5432)
# Prisma requires a direct or pooled connection string.
DATABASE_URL="postgresql://postgres.your-project-ref:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

> **Note**: For Supabase, it's recommended to use the transaction pooler with `?pgbouncer=true` if you're deploying on Vercel or other serverless environments.

### 3. Database Setup

1. **SQL Migrations**: Run the initial schema migration in your Supabase SQL Editor. The script is located at `supabase/migrations/20240101000000_initial_schema.sql`.
2. **Prisma Generate**: Generate the Prisma client based on the schema.

```bash
npx prisma generate
```

### 4. Authentication Setup

In the Supabase Dashboard:
1. Go to **Authentication > Providers** and ensure **Email** is enabled.
2. (Optional) Disable **Confirm Email** for easier testing during development.
3. Create at least one user manually or via the sign-up flow.
4. To make a user an **Admin**, update their role in the `profiles` table:
   ```sql
   update profiles set role = 'admin' where email = 'admin@example.com';
   ```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- **Employee Dashboard**: Toggle remote/office status, view personal schedule in Month, Week, Day, and List views.
- **Admin Dashboard**: Monitor team presence, view aggregated occupancy, and manage the team roster.
- **Authentication**: Secure login and route protection using Supabase Auth and Next.js Middleware.
- **Type Safety**: Fully typed data layer with Prisma ORM.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Notifications**: Sonner
