---
name: setup
description: Guided first-time setup that connects this app to Supabase, Vercel, Stripe and Resend and gets it live. Use when the user types /setup, says they're new, or the app isn't deployed or configured yet.
---

# First-time setup

The user is probably not an engineer. Be warm, go **one step at a time**, and wait for them to confirm each step before moving on. Use plain English and give exact click paths.

Track progress in `docs/setup-status.md` (create it), a checklist you tick off, so a new session can resume. If it exists, read it first and continue where it left off.

## Golden rule for keys
**Never ask the user to paste a secret key into this chat.** Tell them exactly where to paste it (Vercel env vars, or the Claude Code environment's network secrets). Only *publishable* values (Supabase URL, publishable key, Stripe price ID) may be shared in chat.

## Step 0: Check the environment
1. Explain in two sentences what you're about to do and that it takes about 20 minutes.
2. Check which tools you have: Supabase / Vercel / Stripe MCP servers or claude.ai connectors. Note which are missing.
3. If in a cloud session, test network access: `curl -s -o /dev/null -w "%{http_code}" https://api.supabase.com`. If blocked, tell the user to edit their environment at claude.ai/code → environment settings → Network access → add `*.supabase.co`, `api.supabase.com`, `*.vercel.com`, `api.stripe.com`, `api.resend.com`, then start a new session.
4. If an MCP server needs sign-in, tell them to approve it (in the terminal: `/mcp`; on the web: the sign-in card).

## Step 1: Supabase (database + logins)
1. If they have no account: send them to https://supabase.com/dashboard and say "Sign up with GitHub."
2. Create a project (via Supabase MCP if available; otherwise guide them to **New project**, name it after their business, save the database password in their password manager).
3. Apply `supabase/migrations/*.sql` (Supabase MCP `apply_migration`, or `npx supabase link` + `npx supabase db push`).
4. Run `supabase/checks/rls.sql`. Both result sets must be empty.
5. Collect: Project URL + publishable key (fine in chat). Tell them the **secret key** location (Project Settings → API Keys) but have them paste it only into Vercel in Step 2.

## Step 2: Vercel (put it on the internet)
1. Send them to https://vercel.com/new and say: sign in with GitHub → **Import** this repository → don't deploy yet if it offers env vars; add them first.
2. Environment variables (Vercel → Project → Settings → Environment Variables), using names from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
   - `NEXT_PUBLIC_SITE_URL` = their production URL (e.g. `https://my-business.vercel.app`)
3. Deploy. Get the URL.
4. Back in Supabase → Authentication → URL Configuration: **Site URL** = production URL; **Redirect URLs** add `https://<their-domain>/**` and `https://*-<vercel-team>.vercel.app/**` for preview deployments.
5. Have them open the site, sign in with their email, and add a test customer. ✅ when it works.

## Step 3: Stripe (payments), TEST MODE ONLY
1. Sign up at https://dashboard.stripe.com/register. Make sure **Test mode** is on. Identity verification can wait until launch.
2. Create a product "Pro" with a monthly price (Stripe MCP, or Product catalog → Add product). Get the `price_...` ID.
3. Developers → Webhooks → Add endpoint: `https://<their-domain>/api/stripe/webhook` with events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. In Vercel env vars: `STRIPE_SECRET_KEY` (test `sk_test_...`), `STRIPE_WEBHOOK_SECRET` (`whsec_...` from the endpoint), `STRIPE_PRICE_ID`. Redeploy.
5. Test: Pricing → Upgrade → card `4242 4242 4242 4242` → dashboard shows "Pro ✅".

## Step 4: Resend (email)
1. Sign up at https://resend.com → API Keys → create one → paste into Vercel as `RESEND_API_KEY`. Redeploy.
2. Explain: until they verify a domain, Resend only delivers to their own email. Domain verification (DNS records) is a later lesson; offer to walk them through it now if they own a domain.

## Step 5: Make it theirs
1. Ask their business name and what the app is for. Update `BUSINESS_NAME` in `src/app/layout.tsx`, the homepage copy, and the project description at the top of `CLAUDE.md`.
2. Run `npm test` and `npm run build`, commit on a branch, open a PR, merge, and confirm the live site updated.
3. Run `/check-secrets`.

## Finish
Celebrate. Summarize what's live, with links. Recommend the next step: "Run `/plan-feature` to design your first real feature."
