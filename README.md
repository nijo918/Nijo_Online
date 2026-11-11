# Nijo Learn

A free, self-paced learning MVP built with Next.js App Router, React, TypeScript, Tailwind and Supabase Auth/PostgreSQL. The app includes the learner journey, an admin course editor, three original courses, transactional grading and downloadable certificates of completion.

## Connected hosted development project

As of 11 November 2026, `.env.local` connects this workspace to **nijo-learn-dev** in **nijo918's Org** (Ireland / `eu-west-1`). The project was created at the quoted **$0/month**.

- Dashboard: https://supabase.com/dashboard/project/mtxvulajjtypfoemqhcw
- API URL: https://mtxvulajjtypfoemqhcw.supabase.co
- The tracked database migration and three original courses are installed. Migration history matches `20261110155849_nijo_learn_mvp.sql`.
- The app uses the project's publishable key. `.env.local` is ignored by Git; the running app needs no service-role key.

To use this hosted connection, run `npm.cmd run dev` and open http://localhost:3000. Docker and a local database reset are unnecessary for this path. Keep `.env.local`; copying `.env.example` over it would replace the hosted settings.

Hosted signup now uses an **8-digit email OTP**. Gmail custom SMTP and the Confirm signup email template have been saved in Supabase and verified after reloading the dashboard. The template renders `{{ .Token }}` and contains no confirmation link. Email confirmation remains enabled; the hosted OTP length is 8 and expiry is 3600 seconds. The application and local email configuration match that length. SMTP uses `smtp.gmail.com` on port 587; its password is stored only in Supabase. Actual inbox delivery and successful user confirmation still need the final user test. Gmail is for this low-volume development setup; the dashboard warns that personal email providers may have delivery limitations. Password recovery still requires the recovery template and callback settings described below.

Gmail SMTP and the hosted OTP template are configured for this project. See [Gmail SMTP development setup](docs/gmail-smtp-setup.md) for the settings, maintenance and final delivery test.

## Start on Windows

Prerequisites: Node.js **22 LTS or newer**, npm, VS Code, Git (optional), and **Docker Desktop using Linux containers/WSL 2**. Start Docker Desktop before starting Supabase. Node 25 was available in the build environment; Node 22/24 LTS is recommended for regular development.

Open PowerShell in this folder:

```powershell
Set-Location C:\Users\nijo0\Desktop\nijoonline
node --version
npm.cmd --version
docker version
npm.cmd ci
npx.cmd supabase start
npx.cmd supabase db reset
npx.cmd supabase status
Copy-Item .env.example .env.local
code .env.local
```

This repository pins **Supabase CLI 3.1.0**. Database commands target the **local** stack by default. Do not add --remote to local commands. The reset above deletes data only in this project's local stack and applies the tracked migration and seed. Never run a reset against a hosted project.

Copy the local **Project URL** and **Publishable** key from supabase status into NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Leave NEXT_PUBLIC_APP_URL=http://localhost:3000. Set NIJO_DEV_PROJECT=true only for a dedicated development environment. The service_role/secret key is needed only for the development account commands and live test runner; it is never needed by the running application and must never have a NEXT_PUBLIC_ prefix.

```powershell
npm.cmd run dev
```

Open **http://localhost:3000**. Supabase Studio: http://127.0.0.1:54323. Local email inbox (Mailpit): http://127.0.0.1:54324. Use localhost consistently for the app so the auth cookie and redirect origin match. If the app URL changes, update NEXT_PUBLIC_APP_URL and Supabase's allowed redirect URLs, then restart the app.

Without Supabase environment values, the app intentionally serves a labelled, read-only **catalog preview**. It does not simulate accounts, enrollment, scores or certificates. /setup explains how to connect the real backend. A configured but unavailable database produces a retryable error instead of silently substituting preview data.

## Accounts and first admin

Normal signup always creates a learner. Register in the app and enter the **8-digit code** from the confirmation email at `/auth/confirmation`. For local Supabase, find the email in Mailpit. Confirmation is enabled in `supabase/config.toml`; the confirmation template displays `{{ .Token }}`. Successful verification creates the session and continues to the originally requested page. Invalid, expired or already-used codes show a retry message. **Resend code** requests a fresh signup confirmation without requiring a code; the email field remains editable. The app remembers the email in a temporary HttpOnly cookie, keeping it out of redirect URLs. Supabase enforces verification and resend rate limits. Password recovery continues to use the token-hash link handled by `/auth/callback`; `/auth/forgot-password` gives a generic response and its email link leads to `/auth/update-password`.

To promote an existing **verified development user**, put the service-role/secret key from supabase status in SUPABASE_SERVICE_ROLE_KEY in .env.local, set NIJO_DEV_PROJECT=true, then run:

```powershell
$env:ADMIN_EMAIL = Read-Host 'Verified development admin email'
npm.cmd run dev:admin
Remove-Item Env:ADMIN_EMAIL
```

The command uses a service-role-only RPC to create trusted admin membership. The application never reads roles from editable user metadata. Public users cannot invoke this RPC. Keep the key out of Git and browser code.

For repeatable **local-only** demo accounts, supply credentials for this run. Existing matching development accounts have their passwords updated. Use addresses reserved for this demo:

```powershell
$env:DEMO_LEARNER_EMAIL = Read-Host 'Demo learner email'
$env:DEMO_LEARNER_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Learner password (10+ characters)' -AsSecureString)).Password
$env:DEMO_ADMIN_EMAIL = Read-Host 'Demo admin email'
$env:DEMO_ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Admin password (10+ characters)' -AsSecureString)).Password
npm.cmd run dev:accounts
Remove-Item Env:DEMO_LEARNER_EMAIL, Env:DEMO_LEARNER_PASSWORD, Env:DEMO_ADMIN_EMAIL, Env:DEMO_ADMIN_PASSWORD
```

These two accounts are preconfirmed for demos. Test ordinary email signup separately. No credentials are checked in or printed by these scripts.

## Dedicated hosted development project

Create a separate Supabase project for development. The commands below apply the **same migrations** used locally. Replace YOUR_DEVELOPMENT_PROJECT_REF with that project's exact reference; the CLI's confirmation must identify the development project you intended. No hosted project has been modified during this build.

```powershell
npx.cmd supabase login
npx.cmd supabase link --help
npx.cmd supabase link --project-ref YOUR_DEVELOPMENT_PROJECT_REF
npx.cmd supabase db push --remote --dry-run
npx.cmd supabase db push --remote --include-seed
```

Do not use --yes to bypass reviewing the hosted target. Do not use db reset --remote. Change .env.local to the project's URL and publishable key; set NIJO_DEV_PROJECT=true only after confirming it is a dedicated development project. The dev:admin command supports this development path; dev:accounts and live destructive test fixtures refuse hosted URLs.

In the hosted dashboard:

1. Enable email/password and **Confirm email**. Set minimum password length to 10.
2. Set Site URL to http://localhost:3000. Allow http://localhost:3000/auth/callback and its query variants (http://localhost:3000/auth/callback?**).
3. Configure a custom SMTP sender under **Authentication > Emails > SMTP Settings** first. The current free/default-sender setup disables template editing. Then under **Authentication > Email Templates**, copy `supabase/templates/confirmation.html` into **Confirm signup**, with subject **Your Nijo Learn verification code**. It displays `{{ .Token }}` as the OTP, rather than a confirmation link. Set email OTP length to **8** and keep a bounded expiry (the local configuration uses 3600 seconds). Copy `supabase/templates/recovery.html` into **Reset password**; only the recovery template appends `token_hash` and `type` to the supplied `RedirectTo` URL.
4. Configure custom SMTP for demos to people outside your Supabase organization. Supabase's built-in hosted sender has recipient and rate limits. Keep the default Auth rate limiting protections enabled.
5. Keep the **private** schema out of exposed Data API schemas. Only public is needed. The migration supplies explicit grants and RLS policies.
6. Create and verify your admin account normally, then use dev:admin with the development project's server-only secret.

Restart npm run dev after changing environment values.

## Demo walkthrough

1. Browse /courses. Search Networking, filter category/type, and open Networking Basics.
2. Register, enter the 8-digit email verification code (from Mailpit when using local Supabase), then enroll. Repeated enrollment requests return the same record.
3. Open a lesson, reload, then visit My learning. The resume position is saved independently of completion.
4. Mark all four Networking lessons complete. Open Connections checkpoint; choose incorrect answers once, submit, then retake and pass.
5. Pass Networking final assessment. Completion requires every required lesson and **both distinct required assessments**. Passing the same quiz twice does not replace the final.
6. Open the certificate from My learning and download the PDF. Its name and course title are frozen at issuance. Open its verification page in a signed-out/private window: only course, issuer and issue date are public.
7. Sign in as admin, open /admin, duplicate a published course into a new draft, edit/reorder content, save, preview and publish. A summary, outcome, required lesson and valid required assessment are required. Each question needs at least two options and exactly one correct answer.
8. Archive the new edition. It leaves the catalog and rejects new enrollments; enrolled learners retain lessons, progress and certificates. Published content cannot be edited; duplicate it for changes.

## Checks

```powershell
npm.cmd run format:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:db
npm.cmd run build
npm.cmd run test:e2e
```

Browser checks use installed Google Chrome (Playwright channel chrome), desktop and iPhone-sized Chromium viewports. Install Chrome if unavailable, or adjust the channel in playwright.config.ts to an installed browser. npm run test:e2e runs public checks; live cases are explicitly skipped until E2E_LIVE=1. Screenshots and traces go to ignored test-results.

The embedded test:db suite runs the actual migration and seed in **PGlite (PostgreSQL)**, with test-only Auth schema/roles. It verifies RLS by SET ROLE, not by hiding UI controls. It covers direct write denial, private answer keys, enrollment retries, progress, invalid submissions, fail/retake, exact pass thresholds, certificate snapshots, validation, immutable editions and archive access. This checks PostgreSQL behavior but does not replace real Supabase Auth/PostgREST or independent-connection concurrency testing.

After starting the **local** stack and configuring .env.local, run:

```powershell
npm.cmd run test:integration
$env:E2E_LIVE = '1'
node --env-file=.env.local node_modules/@playwright/test/cli.js test
Remove-Item Env:E2E_LIVE
```

The integration runner creates local, temporary confirmed users and sends overlapping REST requests for enrollment, lesson completion and grading. It checks isolation directly through PostgREST and verifies that duplicate request IDs produce one attempt. Live browser tests exercise learner/admin journeys, recovery/confirmation, download and verification. Test records remain in the disposable local stack as evidence; reset locally before repeating a clean demo. These live tests never reset or connect to hosted projects.

npm run seed:generate regenerates supabase/seed.sql from the original content and catalog metadata. The seed preserves existing course slugs if repeated and is automatically applied on local reset. Editing content files alone does not rewrite existing published database editions.

For a production-mode local run:

```powershell
npm.cmd run build
npm.cmd start
```

Stop an existing development server first so port 3000 is free.

## Architecture and security

- src/features/auth: identity and recovery actions; src/lib/supabase/server.ts and src/proxy.ts: SSR cookies and verified token refresh. Protected actions call getUser; database functions independently verify auth.uid() and confirmed email.
- src/features/courses: catalog queries/types; src/features/learning: owned enrollment access and mutations; src/features/admin: validation/editor/privileged actions; src/features/certificates: owned credentials.
- supabase/migrations: authoritative schema and transactional business rules. database/schema.sql is its readable source snapshot; edit future changes using new CLI-generated migrations, not by rewriting an applied migration.
- All exposed tables enable RLS. Clients have SELECT grants only. The public RPCs are invoker wrappers; actor-checked privileged implementations live in private with fixed empty search paths and explicit EXECUTE grants. Internal helpers cannot be called by application roles. Answer keys never enter learner RSC payloads, JavaScript or API query results.
- Enrollment has a unique learner/edition key. Lesson completion and quiz grading lock the enrollment row before checking completion. Attempts use a unique enrollment/request key; certificates use a unique enrollment key. Quiz answers must match every question and option in the assessment. Pass decisions compare exact integer counts; display rounding cannot change the result.
- All signed-in pages and PDFs are private/no-store. The application uses session-scoped keys and RLS, with no service-role key in normal requests. Markdown HTML is skipped and sanitized; remote Markdown images are disabled; videos accept only exact privacy-enhanced YouTube embed URLs with a text alternative.
- Course outlines are public for published editions; lesson bodies, questions and options require enrollment or admin membership. Admin content responses may contain answer keys because they are authorized editor data. Public certificate verification contains no learner name/email.
- Draft content is replaced in one transaction. Published/archived editions have content guards. Required lessons and distinct passed assessments determine course progress. Completion/certificates are database-owned, never client-supplied.

Credentials prove **course completion** and do not claim professional accreditation. Noto Sans is bundled with its SIL Open Font License for portable PDF rendering.

## References checked for this build

[Next.js App Router](https://nextjs.org/docs/app), [Next.js Server Actions](https://nextjs.org/docs/app/guides/server-actions), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [local development](https://supabase.com/docs/guides/local-development), [email testing](https://supabase.com/docs/guides/auth/testing-auth-flows), and the [CLI v3 breaking change](https://supabase.com/changelog/supabase-cli-v3). The installed Next.js documentation was also checked. Package versions and transitive dependencies are pinned in package-lock.json.

See VERIFICATION.md for the actual results and remaining environment blockers from this build.
