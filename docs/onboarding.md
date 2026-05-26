# Developer Onboarding Guide

Welcome to the Office Presence Tracker project! This guide will help you set up your local development environment and understand our workflow.

## 1. Local Setup

### Prerequisites
- Node.js 18 or higher
- A Supabase account (or local Supabase CLI setup)
- Git

### Cloning and Installing
```bash
git clone https://github.com/your-org/office-presence-tracker.git
cd office-presence-tracker
npm install
```

### Environment Variables
You must configure your `.env.local` file before running the application. Ask your team lead for access to the staging environment keys, or set up a personal Supabase project.

Create `.env.local` in the root directory:
```env
# Found in Supabase Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Found in Supabase Project Settings > Database > Connection strings > URI
# Ensure you use the Session/Transaction pooler port (6543) and append ?pgbouncer=true
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Service role key is required for admin actions (inviting users, deleting users)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Database Setup (Prisma)
1. Run the migrations against your database to create the tables.
2. Generate the local Prisma client types:
```bash
npx prisma generate
```

## 2. Running the Project

Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 3. Creating Test Users

1. Go to your Supabase Dashboard > Authentication.
2. Manually add a user with email/password.
3. To test the Admin dashboard, you must manually elevate the user in the database via the SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

## 4. Coding Guidelines

- **Server vs Client Components:** We use Next.js App Router. Components are Server Components by default. If you need `useState`, `useEffect`, or interactive event handlers (like `onClick`), add `'use client'` to the very top of the file.
- **Data Mutations:** Use Server Actions located in `lib/actions/`. Do not create traditional API routes (`/api/...`) unless interacting with external webhooks.
- **Styling:** Use Tailwind CSS classes. For UI components (Buttons, Inputs, Dialogs), import them from `@/components/ui/` (shadcn/ui). Do not build primitive components from scratch.
- **Routing & Authentication:** Route protection is handled in `lib/supabase/middleware.ts`. Do not write component-level auth checks unless adjusting the UI rendering.

## 5. Git Workflow & Branching Strategy

- **Main Branch (`main`):** Represents the production-ready code. Commits here are automatically deployed to Vercel production.
- **Feature Branches (`feat/...`, `fix/...`, `chore/...`):** Create a new branch from `main` for every task.
- **Pull Requests:** Open a PR against `main`. Vercel will automatically generate a Preview Deployment for your PR. Review the preview URL before merging.

## 6. Build Process & Deployment

The application is deployed on Vercel. 
The Vercel build command is configured as:
```bash
prisma generate && next build
```
This is critical! If you change `package.json`, ensure this build script remains intact, otherwise production deployments will fail with stale Prisma clients.
