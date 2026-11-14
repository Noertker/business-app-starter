# Built-in security

This starter protects you in three layers, with no setup needed beyond clicking "Use this template."

## 1. Guardrails while the AI works (automatic)
A guard runs before every file the AI writes and every command it runs. It **stops** the AI if it tries to:
- paste an API key (Stripe, Supabase, Resend, GitHub, AWS) or private key into your code
- expose a secret to the browser through a `NEXT_PUBLIC_` variable
- force-push, skip safety checks, wipe your production database, drop tables, or turn off data protection
- print your `.env` secrets into the chat

When blocked, the AI sees why and fixes its approach.

## 2. Security commands you can run anytime
| Type this | What it does |
|---|---|
| `/security-audit` | Hires the AI as a hacker against your app; writes a plain-English report to `docs/security.md` |
| `/check-secrets` | Searches your code *and its entire history* for leaked keys, and tells you how to replace any it finds |
| `/test-data-isolation` | Creates two fake users and proves neither can see the other's data |
| `/prelaunch` | Go-live checklist: security, payments, email, backups, legal pages |
| `/security-review` | Claude Code's built-in review of your latest changes |

## 3. Automatic checks on GitHub
Every change and every Monday, GitHub runs:
- **gitleaks**: leaked-secret scanner
- **npm audit**: known-vulnerable packages
- **CodeQL**: GitHub's code security scanner
- **Your tests**, including the data-isolation test
- **Dependabot**: opens updates for vulnerable packages

A red ❌ on a pull request means don't merge yet. Ask Claude: *"The security check failed on this PR. Explain why and fix it."*

## Limits
These tools catch common, serious mistakes. They don't replace a professional review if you handle health, financial or children's data, or have legal compliance requirements.
