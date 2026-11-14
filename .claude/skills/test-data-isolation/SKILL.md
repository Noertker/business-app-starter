---
name: test-data-isolation
description: Prove that users cannot read, change or delete each other's data. Use after adding any table, policy or route that stores user data, and before launch.
---

# Data isolation test

Goal: an automated test that **fails loudly** if user B can touch user A's data.

1. Run against a **local or branch database only** (`supabase start`, or a Supabase preview branch). Never create test users in production.
2. Write `tests/security/data-isolation.test.ts` (use the project's test runner; default to Vitest):
   - Create users A and B with the Supabase auth admin API (server-side, test only).
   - As A, create one row in every user-owned table.
   - Sign in as B with the **anon/publishable key** (exactly like the browser) and try to `select`, `update`, `delete` A's rows in every table. Every attempt must return no rows or an error.
   - As B, call every API route / server action that takes a record ID, passing A's IDs. Each must return 403/404.
   - Signed out, repeat the reads. All must fail.
3. Run it and show the user a pass/fail table per table and per route.
4. If anything passes that shouldn't, explain the leak in plain English, propose the RLS policy or route fix, and re-run after approval.
5. Add the test to the default `npm test` so CI runs it on every PR.
