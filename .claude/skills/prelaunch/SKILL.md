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

**Email (Resend)**
- [ ] Sending domain verified (SPF/DKIM); test email lands in inbox, not spam

**Data**
- [ ] Supabase backups enabled; user knows how to restore
- [ ] Test/seed data removed from production

**Operations & legal**
- [ ] Custom domain + HTTPS working
- [ ] Error alerts reach the owner's email
- [ ] Privacy policy and terms pages exist and mention Stripe, Supabase and Resend as processors
