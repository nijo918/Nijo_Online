# Build verification â€” 10 November 2026

## Missing OTP investigation - 11 November 2026

Auth logs identify the most recent observed signup as user_repeated_signup for an account that was already email-confirmed before the SMTP setup. Both existing test accounts have email_confirmed_at timestamps. The associated resend returned 200 without a mail.send event, and no new account or signup request was found in the later diagnostic window. The open browser confirmation form still showed the existing confirmed account. This explains that observed attempt; a separately reported new-address attempt still needs its email address/message to identify it in logs. No SMTP error was recorded for the inspected window, and actual delivery through Gmail remains unverified.

Adjusted the signup/confirmation wording to state that new or pending accounts receive codes, while already-confirmed users should sign in with their original password or reset it. Resend now surfaces a retryable message on server failures instead of implying that mail will arrive. The app still preserves generic responses and does not disclose account-existence details from public signup actions. No accounts, passwords, confirmation states, SMTP credentials or rate limits were changed.

## Hosted signup OTP configured - 11 November 2026

Gmail custom SMTP is saved for nijo-learn-dev. The user entered the Google app password directly in Supabase. Corrected the SMTP port from 583 to 587 and confirmed the saved host smtp.gmail.com, sender name Nijo Learn, hidden stored password, and port 587 after navigating away and loading the settings again. No SMTP password was copied into the workspace or printed.

Applied the signup email subject Your Nijo Learn verification code and the exact HTML in supabase/templates/confirmation.html. The body contains {{ .Token }} and no confirmation URL. Reloading the dashboard confirmed the template persisted. Email confirmation is still enabled. The hosted provider uses eight-digit OTPs with a 3600-second expiry; matched the application and local email configuration to eight digits rather than reducing the hosted setting. EMAIL_OTP_LENGTH is shared by the form labels, input constraints and server validator.

Validation passed: TypeScript, ESLint, six unit tests, formatting, and four browser checks covering desktop/mobile OTP input and connected-backend rejection of invalid codes without creating a session. The local Mailpit success/reuse/recovery test was updated for eight digits but still requires the local Supabase stack. Actual Gmail inbox delivery and successful confirmation of a real signup are awaiting the user test. The user was asked to request a fresh code and enter it in the app, without posting the code in chat.

This update supersedes the earlier delivery-blocker and six-digit setup notes below. The hosted email template and SMTP configuration are now saved. Gmail remains a development sender; Supabase displays a deliverability notice for personal email providers.

## Hosted signup OTP delivery blocker - 11 November 2026

Inspected the actual hosted Confirm sign up email editor in the normal Edge browser. It shows the default subject, disables source editing and Save changes, and states: "Set up custom SMTP to edit templates" and "Emails will be sent using the default templates." Its alternate menu offers a paid upgrade or a Send Email hook. No paid upgrade, email provider, hook, SMTP credentials or hosted template changes were made.

The earlier app code and local template changes are ready, but this confirms the hosted signup email still sends a confirmation link. An SMTP provider and sender credentials are needed before the OTP template can be activated. Merely signing in to the CLI or pasting the template is insufficient while this sender restriction applies. The broken supabase.com frame is the email preview within the editor; the surrounding dashboard is accessible in the normal browser.

Next: configure the user's SMTP provider at `/auth/smtp`, apply `supabase/templates/confirmation.html` with `{{ .Token }}` to Confirm sign up, retain six-digit OTPs and email confirmation, and verify delivery and successful code confirmation with the user's test account. README.md now records this prerequisite.

## Email OTP verification update - 11 November 2026

Signup confirmation now uses a six-digit email code entered at `/auth/confirmation`. The server validates the email/code and calls Supabase `verifyOtp` with type `email`; it redirects only after receiving a session and a confirmed user. Resend uses the signup confirmation API and does not require a code. A scoped, temporary HttpOnly cookie preserves the entered email; neither email nor OTP is placed in redirect URLs. The confirmation template now renders `{{ .Token }}` and the local configuration uses the verification-code email subject. Password recovery remains a link-based flow.

Verification: TypeScript checking and ESLint passed; all six unit tests passed. The OTP form checks passed at desktop and mobile sizes. Two additional checks against the connected backend passed: invalid codes are rejected, the email is retained in an HttpOnly cookie, unsafe `next` URLs fall back to the dashboard, and no auth session is created. The local Mailpit flow test was updated to cover correct/incorrect/reused codes and recovery, but was not run because no local Supabase/Mailpit stack is available. Actual successful email delivery and verification remain unverified.

The hosted email template has NOT been changed. The installed Supabase connector does not expose Auth configuration updates, browser automation was unavailable, and the Supabase CLI returned `AccessTokenRequiredError` even after sign-in was reported. To activate OTP emails, apply `supabase/templates/confirmation.html` to the hosted Confirm signup email template and keep email OTP length set to 6; README.md has the dashboard instructions. A minimal configuration for a future scoped CLI diff/push is prepared in the ignored `supabase/.temp/otp-config` directory. No authentication tokens were printed or saved to the repository.

## Hosted connection update - 11 November 2026

Created `nijo-learn-dev` (`mtxvulajjtypfoemqhcw`) in `nijo918's Org`, region `eu-west-1`, at the quoted $0/month. Its status is `ACTIVE_HEALTHY`. The original build report below describes the earlier local-only verification state.

Applied the tracked schema and seed to this new project and aligned its migration history with `20261110155849_nijo_learn_mvp.sql`. Configured the ignored `.env.local` with the hosted API URL, active publishable key and localhost app URL. No service-role key was saved.

Verified against the live hosted API from this computer: all three published courses and all three categories load using the publishable key; anonymous profile access is denied with PostgreSQL code `42501`. SQL confirms every public table has RLS enabled. Security advisors report no warnings/errors and two informational notices for the deliberately policy-free, locked private tables `admin_members` and `answer_keys`. The Auth settings endpoint confirms email/password signup is enabled and email confirmation is required.

The local Next.js development server is running at http://localhost:3000. HTTP checks passed with status 200 for `/`, `/courses`, `/courses/networking-basics`, and `/auth/sign-in`; the catalog contains the hosted Networking Basics course.

The first network probe failed in the restricted execution sandbox; the same read-only check passed with network access. Hosted email redirect URLs/templates, password policy, actual email delivery, authenticated learner/admin flows and certificate downloads remain unverified. Complete the hosted Auth dashboard instructions in README.md before relying on confirmation/recovery flows. Local destructive integration fixtures remain restricted to local Supabase and were not run against the hosted project.

## Original local build report

The application source is in this workspace. No hosted database was linked, migrated, reset or seeded. The requested local Windows/VS Code development workflow was used; the application was not deployed to a hosting service.

| Check                             | Actual result                                                                                                                                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency installation           | Completed; exact direct versions and npm lockfile included. TypeScript 6.0.3 and ESLint 9.39.5 are pinned to the Next.js lint plugins' supported ranges.                                                                                             |
| Formatting                        | Passed: all matched files use Prettier formatting.                                                                                                                                                                                                   |
| Lint                              | Passed, no warnings/errors.                                                                                                                                                                                                                          |
| Type checking                     | Passed in the standalone check and production build. A parallel run initially raced generated Next.js route files; the final standalone rerun passed after build completion.                                                                         |
| Production build                  | Passed, including all application routes and the Node PDF route.                                                                                                                                                                                     |
| Unit checks                       | 5 passed: safe redirects, approved embeds, exact pass thresholds, draft relationships, and embedded-font PDF generation with accented names.                                                                                                         |
| PostgreSQL checks                 | 12 passed using PGlite's PostgreSQL engine with the actual migration/seed and test Auth roles.                                                                                                                                                       |
| Public browser checks             | 4 passed using installed Google Chrome at desktop and mobile widths. Home/catalog navigation, search/empty results, course detail, horizontal overflow, auth/recovery screens, protected admin redirect, and invalid certificate state were checked. |
| Screenshots                       | Home and course detail captured at both widths and reviewed. Saved in ignored test-results/.                                                                                                                                                         |
| Full local browser suite          | 4 passed, 6 explicitly skipped because E2E_LIVE is not enabled and the Supabase stack is unavailable.                                                                                                                                                |
| Local Supabase startup            | Blocked: Docker and Podman are not installed/on PATH.                                                                                                                                                                                                |
| Supabase database advisors        | Attempted against local 127.0.0.1:54322; connection refused because the stack cannot start.                                                                                                                                                          |
| Live PostgREST/concurrency checks | Included but not run: require the local stack and .env.local.                                                                                                                                                                                        |
| Embedded browser preview handoff  | Unavailable: the browser access host could not open a tab. Automated Chrome browser checks ran successfully.                                                                                                                                         |

The PostgreSQL suite independently verifies anonymous/catalog access, learner-to-learner isolation, denied direct writes to protected records, hidden answer keys, duplicate enrollment and lesson completion, saved resume position, early quiz/certificate blocking, invalid/cross-quiz answers, fail/retake, retry IDs (including changed-payload rejection), exact unrounded grading, distinct-assessment completion, single certificate issuance, issuance snapshots, sanitized public verification, draft validation, immutable published editions, duplication and archive access.

The PDF generator was exercised directly and the output parsed as a one-page PDF with the expected title and dimensions. An authenticated HTTP download and its access headers still require the live Supabase journey. Embedded PostgreSQL checks do not prove GoTrue email delivery, PostgREST response/auth behavior or races across independent database connections. Dedicated live tests for those boundaries are included.

## Exact environment blocker

The verified startup error was:

```text
DockerLifecycleInspectError: docker: command not found (podman also not found)
Install Docker Desktop or Podman and ensure it is on PATH.
```

Install/start Docker Desktop with Linux containers, then use PowerShell:

```powershell
docker version
npx.cmd supabase start
npx.cmd supabase db reset
npx.cmd supabase status
Copy-Item .env.example .env.local
code .env.local
```

Add the local Project URL and Publishable key. For development bootstrap/live tests also add the server-only service-role/secret key and set NIJO_DEV_PROJECT=true. README.md contains the exact account/bootstrap commands, Mailpit instructions, hosted-development alternative and walkthrough.

```powershell
npm.cmd run dev
# App: http://localhost:3000

## Hosted signup OTP delivery blocker - 11 November 2026

Inspected the actual hosted Confirm sign up email editor in the normal Edge browser. It shows the default subject, disables source editing and Save changes, and states: "Set up custom SMTP to edit templates" and "Emails will be sent using the default templates." Its alternate menu offers a paid upgrade or a Send Email hook. No paid upgrade, email provider, hook, SMTP credentials or hosted template changes were made.

The earlier app code and local template changes are ready, but this confirms the hosted signup email still sends a confirmation link. An SMTP provider and sender credentials are needed before the OTP template can be activated. Merely signing in to the CLI or pasting the template is insufficient while this sender restriction applies. The broken supabase.com frame is the email preview within the editor; the surrounding dashboard is accessible in the normal browser.

Next: configure the user's SMTP provider at `/auth/smtp`, apply `supabase/templates/confirmation.html` with `{{ .Token }}` to Confirm sign up, retain six-digit OTPs and email confirmation, and verify delivery and successful code confirmation with the user's test account. README.md now records this prerequisite.

## Email OTP verification update - 11 November 2026

Signup confirmation now uses a six-digit email code entered at `/auth/confirmation`. The server validates the email/code and calls Supabase `verifyOtp` with type `email`; it redirects only after receiving a session and a confirmed user. Resend uses the signup confirmation API and does not require a code. A scoped, temporary HttpOnly cookie preserves the entered email; neither email nor OTP is placed in redirect URLs. The confirmation template now renders `{{ .Token }}` and the local configuration uses the verification-code email subject. Password recovery remains a link-based flow.

Verification: TypeScript checking and ESLint passed; all six unit tests passed. The OTP form checks passed at desktop and mobile sizes. Two additional checks against the connected backend passed: invalid codes are rejected, the email is retained in an HttpOnly cookie, unsafe `next` URLs fall back to the dashboard, and no auth session is created. The local Mailpit flow test was updated to cover correct/incorrect/reused codes and recovery, but was not run because no local Supabase/Mailpit stack is available. Actual successful email delivery and verification remain unverified.

The hosted email template has NOT been changed. The installed Supabase connector does not expose Auth configuration updates, browser automation was unavailable, and the Supabase CLI returned `AccessTokenRequiredError` even after sign-in was reported. To activate OTP emails, apply `supabase/templates/confirmation.html` to the hosted Confirm signup email template and keep email OTP length set to 6; README.md has the dashboard instructions. A minimal configuration for a future scoped CLI diff/push is prepared in the ignored `supabase/.temp/otp-config` directory. No authentication tokens were printed or saved to the repository.

## Hosted connection update - 11 November 2026

Created `nijo-learn-dev` (`mtxvulajjtypfoemqhcw`) in `nijo918's Org`, region `eu-west-1`, at the quoted # App: http://localhost:3000
/month. Its status is `ACTIVE_HEALTHY`. The original build report below describes the earlier local-only verification state.

Applied the tracked schema and seed to this new project and aligned its migration history with `20261110155849_nijo_learn_mvp.sql`. Configured the ignored `.env.local` with the hosted API URL, active publishable key and localhost app URL. No service-role key was saved.

Verified against the live hosted API from this computer: all three published courses and all three categories load using the publishable key; anonymous profile access is denied with PostgreSQL code `42501`. SQL confirms every public table has RLS enabled. Security advisors report no warnings/errors and two informational notices for the deliberately policy-free, locked private tables `admin_members` and `answer_keys`. The Auth settings endpoint confirms email/password signup is enabled and email confirmation is required.

The local Next.js development server is running at http://localhost:3000. HTTP checks passed with status 200 for `/`, `/courses`, `/courses/networking-basics`, and `/auth/sign-in`; the catalog contains the hosted Networking Basics course.

The first network probe failed in the restricted execution sandbox; the same read-only check passed with network access. Hosted email redirect URLs/templates, password policy, actual email delivery, authenticated learner/admin flows and certificate downloads remain unverified. Complete the hosted Auth dashboard instructions in README.md before relying on confirmation/recovery flows. Local destructive integration fixtures remain restricted to local Supabase and were not run against the hosted project.

# Local email: http://127.0.0.1:54324

## Hosted signup OTP delivery blocker - 11 November 2026

Inspected the actual hosted Confirm sign up email editor in the normal Edge browser. It shows the default subject, disables source editing and Save changes, and states: "Set up custom SMTP to edit templates" and "Emails will be sent using the default templates." Its alternate menu offers a paid upgrade or a Send Email hook. No paid upgrade, email provider, hook, SMTP credentials or hosted template changes were made.

The earlier app code and local template changes are ready, but this confirms the hosted signup email still sends a confirmation link. An SMTP provider and sender credentials are needed before the OTP template can be activated. Merely signing in to the CLI or pasting the template is insufficient while this sender restriction applies. The broken supabase.com frame is the email preview within the editor; the surrounding dashboard is accessible in the normal browser.

Next: configure the user's SMTP provider at `/auth/smtp`, apply `supabase/templates/confirmation.html` with `{{ .Token }}` to Confirm sign up, retain six-digit OTPs and email confirmation, and verify delivery and successful code confirmation with the user's test account. README.md now records this prerequisite.

## Email OTP verification update - 11 November 2026

Signup confirmation now uses a six-digit email code entered at `/auth/confirmation`. The server validates the email/code and calls Supabase `verifyOtp` with type `email`; it redirects only after receiving a session and a confirmed user. Resend uses the signup confirmation API and does not require a code. A scoped, temporary HttpOnly cookie preserves the entered email; neither email nor OTP is placed in redirect URLs. The confirmation template now renders `{{ .Token }}` and the local configuration uses the verification-code email subject. Password recovery remains a link-based flow.

Verification: TypeScript checking and ESLint passed; all six unit tests passed. The OTP form checks passed at desktop and mobile sizes. Two additional checks against the connected backend passed: invalid codes are rejected, the email is retained in an HttpOnly cookie, unsafe `next` URLs fall back to the dashboard, and no auth session is created. The local Mailpit flow test was updated to cover correct/incorrect/reused codes and recovery, but was not run because no local Supabase/Mailpit stack is available. Actual successful email delivery and verification remain unverified.

The hosted email template has NOT been changed. The installed Supabase connector does not expose Auth configuration updates, browser automation was unavailable, and the Supabase CLI returned `AccessTokenRequiredError` even after sign-in was reported. To activate OTP emails, apply `supabase/templates/confirmation.html` to the hosted Confirm signup email template and keep email OTP length set to 6; README.md has the dashboard instructions. A minimal configuration for a future scoped CLI diff/push is prepared in the ignored `supabase/.temp/otp-config` directory. No authentication tokens were printed or saved to the repository.

## Hosted connection update - 11 November 2026

Created `nijo-learn-dev` (`mtxvulajjtypfoemqhcw`) in `nijo918's Org`, region `eu-west-1`, at the quoted # Local email: http://127.0.0.1:54324
/month. Its status is `ACTIVE_HEALTHY`. The original build report below describes the earlier local-only verification state.

Applied the tracked schema and seed to this new project and aligned its migration history with `20261110155849_nijo_learn_mvp.sql`. Configured the ignored `.env.local` with the hosted API URL, active publishable key and localhost app URL. No service-role key was saved.

Verified against the live hosted API from this computer: all three published courses and all three categories load using the publishable key; anonymous profile access is denied with PostgreSQL code `42501`. SQL confirms every public table has RLS enabled. Security advisors report no warnings/errors and two informational notices for the deliberately policy-free, locked private tables `admin_members` and `answer_keys`. The Auth settings endpoint confirms email/password signup is enabled and email confirmation is required.

The local Next.js development server is running at http://localhost:3000. HTTP checks passed with status 200 for `/`, `/courses`, `/courses/networking-basics`, and `/auth/sign-in`; the catalog contains the hosted Networking Basics course.

The first network probe failed in the restricted execution sandbox; the same read-only check passed with network access. Hosted email redirect URLs/templates, password policy, actual email delivery, authenticated learner/admin flows and certificate downloads remain unverified. Complete the hosted Auth dashboard instructions in README.md before relying on confirmation/recovery flows. Local destructive integration fixtures remain restricted to local Supabase and were not run against the hosted project.

```

After configuration:

```powershell
npm.cmd run test:integration
$env:E2E_LIVE = '1'
node --env-file=.env.local node_modules/@playwright/test/cli.js test
Remove-Item Env:E2E_LIVE
npx.cmd supabase db advisors
```

The development server used for QA is stopped at handoff. Run npm.cmd run dev to reopen it. Without Supabase values, the labelled catalog preview works; accounts and saved learning remain unavailable until configured.
