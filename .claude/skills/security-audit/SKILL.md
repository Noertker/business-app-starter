---
name: security-audit
description: Full security audit of the app. Use when the user asks for a security check or audit, before launch, or after changes to logins, data access, payments or email.
---

# Security audit

Act as a security reviewer hired to break this app. Do NOT fix anything during the audit. Report first, then fix only what the user approves.

## Check each area

1. **Secrets**: run the `check-secrets` skill steps (repo + git history + browser exposure).
2. **Database access**: run `supabase/checks/rls.sql` against the database (Supabase MCP/connector `execute_sql`, or ask the user to paste it into the Supabase SQL editor). Every table in `public` must have RLS enabled and at least one policy. Read each policy: does it restrict rows to `auth.uid()` or an owning org? Flag `using (true)` on anything with personal data.
3. **Server routes & actions**: list every API route, route handler and server action. For each, confirm it (a) checks the user is signed in when it should, (b) checks the user owns the record, not just that they're signed in, and (c) validates input (prefer zod).
4. **Trusting the browser**: prices, roles, user IDs, plan level and "is paid" must come from the server or database, never from request bodies or query params.
5. **Payments**: the Stripe webhook verifies its signature with `stripe.webhooks.constructEvent`, is idempotent (handles the same event twice safely), and is the only thing that grants paid access.
6. **Email**: Resend sends only from server code, recipients can't be set by arbitrary users, and there's rate limiting on anything a logged-out user can trigger (contact forms, magic links).
7. **Supabase keys**: the `service_role`/secret key is used only in server code, never imported into a client component.
8. **Dependencies**: run `npm audit --omit=dev` and report high/critical issues.
9. **Headers**: check `next.config` for security headers (CSP, X-Frame-Options/frame-ancestors, Referrer-Policy).

## Report format

Write `docs/security.md` with a table: **Severity** (Critical/High/Medium/Low) · **Finding** · **Real-world risk in plain English** · **Fix** · **Status**. Then summarize the top 3 for the user in non-technical language and ask which to fix.

Also suggest running Claude Code's built-in `/security-review` on the current changes.
