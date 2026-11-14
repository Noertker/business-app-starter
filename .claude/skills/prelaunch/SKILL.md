---
name: prelaunch
description: Go-live checklist covering security, payments, email, backups and legal pages. Use when the user says they're ready to launch or switch to live mode.
---

# Pre-launch checklist

Run each check and report ✅ / ❌ / ⚠️ with a one-line plain-English note. Don't change anything until the user has seen the report.

**Security**
- [ ] `security-audit` has no open Critical/High findings
- [ ] `test-data-isolation` passes
- [ ] `check-secrets` is clean (including git history)
- [ ] GitHub "Security" workflow is green on `main`; Dependabot alerts reviewed

**Payments (Stripe)**
- [ ] Live keys are set in Vercel **Production** env only; test keys in Preview
- [ ] Live-mode webhook endpoint points at the production URL, and its signing secret is set
- [ ] A real $1 purchase + refund works end to end

- [ ] Stripe Customer portal saved (Settings → Billing) in **live** mode too; "Manage billing" works
- [ ] Clicking Upgrade as an existing subscriber opens the portal, not a second checkout

**Email (Resend)**
- [ ] Sending domain verified (SPF/DKIM); test email lands in inbox, not spam
- [ ] Supabase uses Resend as custom SMTP (Auth → Emails → SMTP Settings); a sign-in link reaches an address that is NOT on the Supabase team

**Sign-in**
- [ ] Supabase Redirect URLs list only exact production URLs (no `*` wildcards)

**Data**
- [ ] Supabase on a paid plan (daily backups, no pausing when quiet); owner knows how to restore a backup
- [ ] Test/seed data removed from production

**Operations & legal**
- [ ] Custom domain + HTTPS working
- [ ] Error alerts reach the owner's email
- [ ] `/privacy` and `/terms` have every `[PLACEHOLDER]` filled in (search the repo for `[`); refund policy stated
- [ ] Account page: "Download my data" and "Delete account" both work
