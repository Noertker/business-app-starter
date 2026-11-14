@AGENTS.md

# Project instructions for Claude

<!-- ✏️ /setup replaces this line with what the business is and what the app is for. -->

The owner of this repo is a business owner, not an engineer. Explain decisions in plain English, plan before building (`/plan-feature`), and work on one feature per session. New owner or nothing deployed yet? Run `/setup`.

## Stack
Next.js 16 (App Router, Cache Components on) on Vercel · Supabase (Postgres + Auth) · Stripe · Resend · GitHub.

## Where things live
- `src/lib/auth.ts`: `requireUser()`, the ONLY way to get the signed-in user
- `src/lib/supabase/server.ts`: per-request client acting as the user (RLS applies)
- `src/lib/supabase/admin.ts`: ⚠️ bypasses RLS; trusted server jobs only (the Stripe webhook)
- `src/proxy.ts`: refreshes the login session (Next 16's name for middleware)
- `src/app/dashboard/`: example of user-owned data (customers) with server actions
- `src/app/pricing/` + `src/app/api/stripe/webhook/`: checkout + the only code that grants paid access
- `supabase/migrations/`: database changes (each is a "save point")
- `tests/security/`: guard tests + data-isolation tests

## Next.js 16 gotchas
- Anything that reads the session (cookies) must render inside `<Suspense>`, or the build fails.
- After a server action changes data, call `refresh()` from `next/cache`.
- Read `node_modules/next/dist/docs/` before using an unfamiliar API; this version differs from older training data.

## Security rules (non-negotiable)
1. **No secrets in code.** Read them from `process.env`. Only the Supabase URL, the Supabase publishable key and the Stripe publishable key may be `NEXT_PUBLIC_`. A guard hook (`.claude/hooks/guard.mjs`) enforces this. If it blocks you, change your approach; never work around it.
2. **Never ask the owner to paste a secret into chat.** Tell them where to paste it (Vercel env vars / Claude environment network secrets).
3. **Every table gets row-level security** with policies scoped to `auth.uid()`, in the same migration that creates it, plus a case in `tests/security/data-isolation.test.ts`.
4. **Never trust the browser.** Prices, roles, plan level, ownership and "has paid" come from the server or database.
5. **Every server action and route calls `requireUser()`** and validates input with zod.
6. **Stripe webhooks verify signatures** and are the only thing that grants paid access.
7. **Destructive actions need explicit owner approval**: dropping tables, resetting databases, force-pushing, switching Stripe to live mode.
8. Work on a branch and open a PR. Before merging: `npm test`, `npm run typecheck`, `npm run build`. Run `/security-review` on any PR touching auth, data, payments or email.

## Commands
- `/setup`: first-time guided setup
- `/plan-feature`: design a feature before building
- `/security-audit`, `/check-secrets`, `/test-data-isolation`, `/prelaunch`: security tools (see SECURITY.md)

## Local development (optional)
`npm run db:start` (needs Docker) starts a local database with the migrations applied. `npx supabase status` prints local keys for `.env.local` and for the `TEST_SUPABASE_*` variables that enable the data-isolation tests.
