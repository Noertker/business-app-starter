---
name: plan-feature
description: Plan a new feature with the owner before writing code. Use when the user describes something new they want the app to do.
---

# Plan a feature

Don't write code in this step.

1. Ask up to 5 short questions, one at a time, to understand: who uses it, what they see, what happens step by step, what should happen when something goes wrong, and what "done" looks like.
2. Write a plan in plain English to `docs/features/<short-name>.md`:
   - **What it does** (2–3 sentences)
   - **Screens that change**
   - **Data we store**: new tables or columns, and **who can see and change each row** (RLS policies)
   - **Risks**: flag anything touching logins, personal data, payments or email
   - **How the owner will test it**: a click-through checklist
   - **Build steps**: small, each one shippable
3. Ask for approval. After approval: create a branch, build it step by step, write tests (add the data-isolation case for any new table), run `npm test` and `npm run build`, open a PR, and give the owner the preview URL and their test checklist.
