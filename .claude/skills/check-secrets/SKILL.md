---
name: check-secrets
description: Scan the repo and its git history for leaked API keys, tokens and passwords, and check that no secret reaches the browser. Use before commits that touch config, before launch, or when the user asks if their keys are safe.
---

# Check secrets

Never print a secret's value. Show only the file, line and type (e.g. "Stripe live secret key in lib/stripe.ts:4").

1. **Current files**: search tracked files (`git ls-files`) for: `sk_live_`, `sk_test_`, `rk_live_`, `whsec_`, `re_`-prefixed Resend keys, `sb_secret_`, JWTs (`eyJ...`), `ghp_`/`github_pat_`, `AKIA`, `PRIVATE KEY`.
2. **Git history**: run `git log -p --all` piped through `grep -nE` with the same patterns. A secret in history is leaked even if it's deleted now.
3. **gitleaks** (if available): `npx --yes gitleaks detect --redact` or the CI job's results.
4. **Browser exposure**: list every `NEXT_PUBLIC_` variable. Only the Supabase URL, the publishable/anon key and the Stripe *publishable* key belong there. Check that no file with `"use client"` imports server-only modules (`lib/supabase/admin`, `stripe` server SDK, `resend`).
5. **.gitignore**: confirm `.env`, `.env*.local` and `.vercel` are ignored.

## If a real secret leaked

Tell the user plainly: **deleting it is not enough. The key must be rotated.** Give exact steps for that service (Stripe Dashboard → Developers → API keys → Roll key; Supabase → Project Settings → API; Resend → API Keys → delete + create), then update the new value in Vercel env vars and the Claude environment network secrets.
