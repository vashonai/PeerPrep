# PeerPrep

A collaborative past paper discussion platform for university students. Students upload past exam questions, organise them by course and topic, discuss answers, and see which answers lecturers or student administrators have verified.

The app runs in one of two modes:

- **Supabase** (when `VITE_SUPABASE_URL` is set): real accounts, a Postgres database with row-level security, and file storage.
- **Offline demo** (no Supabase settings): everything runs in the browser against a mock server, which is useful for UI work without a backend.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Supabase values
npm run dev                  # http://localhost:5173
npm run build                # production build into dist/
npm run lint                 # oxlint
```

## Connecting Supabase

1. **Apply the schema.** Open the Supabase dashboard → SQL Editor, paste the contents of `supabase/migrations/20261110000000_initial_schema.sql`, and run it once. (With the Supabase CLI linked, `supabase db push` does the same.)
2. **Configure the app.** In `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Only browser-safe keys go here.
3. **Seed demo data.** Create `.env.seed.local` containing `SUPABASE_SECRET_KEY=<your secret key>`, then run `npm run seed`. This creates the demo accounts and sample content. `npm run seed -- --reset` replaces all content and keeps the accounts.
4. **Auth settings** (Dashboard → Authentication):
   - **Email confirmation:** this is on by default, and new users must click the emailed link before they can sign in. The built-in email sender is heavily rate-limited, so configure custom SMTP before real use.
   - **Site URL / redirect URLs:** add your local and deployed URLs (for example `http://localhost:5173`) so confirmation links return to the app.
   - **Inactivity timeout:** set it to 60 minutes if your plan supports it. The app also signs users out after 60 idle minutes on the client.

> The secret / `service_role` key bypasses every security rule. Never put it in a `VITE_` variable, commit it, or paste it anywhere public. Rotate it if it is ever exposed.

### How security is enforced

- **Row-level security** on every table. Anyone can read questions, answers, courses and verification history. Only the author can write their own content, and only StudentAdmins can manage categories or read the logs.
- **Column privileges:** clients can't set `author_id`, `role` or verification fields directly.
- **RPCs** for privileged actions: deleting (with moderation logging), verifying answers, changing roles and listing users. Each one checks the caller's role in the database and records denied attempts in `access_logs`.
- **Triggers** for derived and audit data:
  - every new user gets the Student role;
  - editing a verified answer resets it to Unverified and records why;
  - category changes are logged;
  - attachment metadata must point into the uploader's own storage folder.
- **Storage bucket `attachments`:** PDF, PNG and JPEG only, up to 5 MB. Users can upload only to `<their user id>/…`.
- Role permissions live in two places, `src/config/roles.js` for the UI and the SQL helper functions `can_contribute()`, `can_verify()` and `is_admin()`. Keep them in sync.

## Demo accounts

When `VITE_DEMO_MODE` isn't `false`, the login page offers **Try a demo account**:

| Role | Email | Password |
|---|---|---|
| Student | student@peerprep.demo | Demo123! |
| Lecturer | lecturer@peerprep.demo | Demo123! |
| Student Administrator | admin@peerprep.demo | Demo123! |

These are **public test credentials**. On Supabase they are real accounts on your shared database: anyone who uses them can post, verify and moderate. Their roles can't be changed. Set `VITE_DEMO_MODE=false` for a real deployment and delete these users.

In offline mode, data lives in this browser's localStorage. **Reset demo data** in the user menu restores the samples.

## Architecture

```
src/
  config/       roles.js (roles + central permission table), env.js (data source, flags)
  data/         models.js (domain constants and typedefs), seed.js (sample data)
  services/     api.js: the only data-access entry point for the UI
    supabase/   Supabase implementation (auth, questions, answers, verification, categories, admin)
    mock/       offline implementation with the same functions
  context/      AuthProvider (session + 60-min inactivity timeout), ToastProvider
  hooks/        useAuth, useAsync, useForm, useCourses, …
  components/   shared UI (ui/ = design-system primitives)
  features/     auth, questions, answers, verification, admin
  layouts/      PublicLayout, AuthLayout, AppLayout (role-aware sidebar)
  pages/        one component per route
  utils/        validation (shared by forms and services), files, search, format
supabase/migrations/   database schema, RLS policies, RPCs, storage policies
scripts/seed-supabase.mjs
```

- **Read models:** the views `question_feed`, `answer_feed`, `course_catalog`, `verification_activity` and the log feeds return the joined shapes the UI needs. They run with the caller's permissions.
- **Search:** `search_questions()` matches every keyword against question text, course and topic names, and answers. It does stemmed English matching plus prefix matching on partial words, backed by GIN indexes.
- **Verification history** is stored as separate append-only `verification_records`. Each answer also carries its current status, reviewer and timestamp.

## Not yet covered

- Automated test suite in the repo, plus load testing against the 3-second search and 500-concurrent-user targets.
- Server-rendered HttpOnly cookie sessions. The Supabase session is kept in `sessionStorage`, so it ends when the tab closes.
- Cleaning up files left behind when an attachment can't be deleted by the current user.
