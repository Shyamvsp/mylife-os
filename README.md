# MyLife OS

A private, responsive personal operating system for studies, fitness, skills, certifications, projects, journal, expenses, goals, habits, files, calendar and analytics.

## Stack
- Next.js App Router + React + TypeScript
- Tailwind CSS v4; dark/light theme
- Supabase Auth, PostgreSQL, Storage and Realtime
- Recharts, Zod, Lucide icons

## 1. Prerequisites
Install Node.js 20.9+ (LTS recommended), Git and VS Code. Create a Supabase project at https://supabase.com.

## 2. Run locally
```bash
npm install
cp .env.example .env.local
# Fill in the Supabase URL, anon key, service-role key and app URL
npm run dev
```
Open http://localhost:3000. Create an account on `/login`.

## 3. Set up the database
In Supabase Dashboard → SQL Editor, run `supabase/migrations/0001_initial_schema.sql`.
Then run `supabase/migrations/0002_storage.sql`.
Enable email/password authentication in Authentication → Providers. For a private single-user system, disable public sign-ups after creating your account. You can create additional users manually from Supabase Auth if needed.

## 4. Storage
The migration creates a private `personal-files` bucket. The app uploads files under `<auth-user-id>/...`. RLS restricts access to the owner. The file manager page lists and uploads files. Never make this bucket public.

## 5. Security checklist
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never use it in browser code or commit `.env.local`.
- RLS is enabled on all user data tables. Each row is scoped to `auth.uid()`.
- Keep sign-ups disabled for a single-user private installation.
- Use a strong unique password and enable MFA in Supabase where available.
- Share links expose only the single selected record, read-only, until expiry or revocation. Anyone holding the link can view that record. Do not share sensitive health, financial or journal data.
- Use HTTPS in production. Configure a custom domain only after deployment.
- Configure backups/PITR appropriate to your Supabase plan. Export important data periodically.

## 6. Deploy
1. Push this project to a private GitHub repository.
2. Import it into https://vercel.com.
3. Add all variables from `.env.example` in Vercel Project Settings → Environment Variables. Use your production app URL for `NEXT_PUBLIC_APP_URL`.
4. Deploy. Add the Vercel production URL to Supabase Authentication → URL Configuration → Site URL and Redirect URLs.
5. Test login, record CRUD, file upload and share-link expiry/revocation.

## 7. How the app is structured
- `src/app`: pages and API routes
- `src/components`: navigation, theme and reusable UI
- `src/lib/supabase`: browser/server Supabase clients
- `src/lib/modules.ts`: module names, descriptions and form fields
- `supabase/migrations`: database schema, RLS and storage policies

## Data model
`entries` is a flexible, module-scoped JSONB record table. It keeps the app extensible: each module has validated form fields in the UI, while PostgreSQL stores structured JSONB and indexed common columns (`module`, `title`, `entry_date`). `profiles`, `share_links` and Supabase Storage provide account, selective sharing and file metadata/storage. For a larger multi-user product, migrate high-volume modules to dedicated normalized tables and add audit/event tables.

## Limitations / next production steps
This is a working full-stack starter, not a certified medical or financial system. Fitness and expense entries are personal tracking only. Add automated tests, rate limiting, audit logs, email-based recovery, monitoring and a formal backup/restore drill before relying on it for critical records. Offline edits are not queued; internet access is needed to save and sync.
