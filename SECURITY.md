# Built-in security

This starter protects you in layers. No single layer is perfect; together they catch the mistakes that most often get small apps hacked.

## 1. Where your secrets live (the most important layer)
Secret keys (Stripe, Supabase, Resend) go in **Vercel → Settings → Environment Variables** and, for Claude on the web, in your environment's **network secrets**. They don't go in your code or the chat. Claude never needs to see them to build your app.

## 2. Your database protects itself
Every table has **row-level security**: the database refuses to show or change rows that don't belong to the signed-in user, even if the app has a bug. Automated tests prove this on every change (two fake users try to read, edit and delete each other's data). Users also can't give themselves a paid plan; only verified Stripe payments can.

## 3. A guard while the AI works
A guard checks every file the AI writes, every command it runs and every database or Stripe action it takes.

**It blocks:**
- putting API keys (Stripe, Supabase, Resend, GitHub, AWS) or private keys into code
- exposing a secret to the browser through a `NEXT_PUBLIC_` variable
- reading `.env` files into the chat
- force-pushing, skipping safety checks, and piping downloaded scripts into a shell
- turning off row-level security, or opening data to signed-out visitors

**It asks you first before:**
- deleting tables or all rows in a table
- wiping or deleting a database
- throwing away uncommitted work

Claude also **asks your permission** before any database change, and before anything in Stripe or Vercel.

> **Limits:** the guard matches known patterns. It catches common, serious mistakes, but it's a safety net, not a locked box: a determined agent could find a way around it. That's why layers 1, 2 and 5 exist.

## 4. Security commands you can run anytime
| Type this | What it does |
|---|---|
| `/security-audit` | Claude acts as a hacker against your app and writes a plain-English report to `docs/security.md` |
| `/check-secrets` | Searches your code *and its entire history* for leaked keys, and tells you how to replace any it finds |
| `/test-data-isolation` | Proves customers can't see each other's data |
| `/prelaunch` | Go-live checklist: security, payments, email, backups, legal pages |
| `/security-review` | Claude Code's built-in review of your latest changes |

## 5. Automatic checks on GitHub
On every change, and every Monday, GitHub runs:
- **gitleaks**: leaked-secret scanner
- **npm audit**: known-vulnerable packages
- **Tests**: including the data-isolation and payment-safety tests
- **CodeQL** code scanning: on public repos only, because it needs a paid GitHub plan for private repos
- **Dependabot**: opens updates for vulnerable packages and actions

A red ❌ on a pull request means don't merge yet. Ask Claude: *"The security check failed on this PR. Explain why and fix it."*

## What's built into the app
- Sign-in by one-time email link (no passwords to leak)
- Payments confirmed only by signed Stripe webhooks, with test/live mode kept separate
- An existing subscriber can't be charged twice
- Customers can download their data or delete their account (which cancels billing first)
- Security headers, including a Content-Security-Policy that blocks scripts and data connections to other sites
- A per-account limit on records, to stop abuse

## Known limits
- The Content-Security-Policy allows inline scripts, because Next.js needs them for this app's fast page loading. React's automatic escaping is the main defence against injected scripts.
- Privacy and terms pages are templates. Fill them in, and get advice if you handle health, financial or children's data, or have legal compliance requirements.
- None of this replaces a professional security review for high-risk apps.

## Reporting a vulnerability
Found a security problem in this starter? Please open a [private security advisory](../../security/advisories/new) rather than a public issue.
