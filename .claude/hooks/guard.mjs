#!/usr/bin/env node
// Security guardrail for Claude Code (PreToolUse hook).
// Blocks the agent from writing secrets into files and from running risky commands.
// Exit code 2 = block the action and show the reason to Claude so it can fix course.

import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const tool = input.tool_name || "";
const ti = input.tool_input || {};

const block = (reason) => {
  process.stderr.write(`🔒 Blocked by security guard: ${reason}\n`);
  process.exit(2);
};

// ---- 1. Secrets in files -------------------------------------------------
const SECRET_PATTERNS = [
  [/sk_(live|test)_[A-Za-z0-9]{16,}/, "Stripe secret key"],
  [/rk_(live|test)_[A-Za-z0-9]{16,}/, "Stripe restricted key"],
  [/whsec_[A-Za-z0-9]{16,}/, "Stripe webhook secret"],
  [/\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9]{8,}/, "Resend API key"],
  [/sb_secret_[A-Za-z0-9_-]{16,}/, "Supabase secret key"],
  [/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, "JWT (possibly a Supabase service_role key)"],
  [/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/, "GitHub token"],
  [/AKIA[0-9A-Z]{16}/, "AWS access key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
];
// Secrets must never be exposed to the browser via NEXT_PUBLIC_ variables.
const PUBLIC_SECRET = /NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE|PRIVATE|WEBHOOK)[A-Z0-9_]*/;

// Local-only, git-ignored env files are the one place a secret may be written.
const ALLOWED_SECRET_FILES = /(^|\/)\.env(\.[a-z]+)?\.local$/;

if (["Write", "Edit", "MultiEdit"].includes(tool)) {
  const file = ti.file_path || "";
  const text = [ti.content, ti.new_string, ...(ti.edits || []).map((e) => e.new_string)]
    .filter(Boolean)
    .join("\n");

  if (!ALLOWED_SECRET_FILES.test(file)) {
    for (const [re, name] of SECRET_PATTERNS) {
      if (re.test(text)) {
        block(`${name} detected in ${file}. Never put secrets in code. Read them from environment variables (process.env.X) and ask the user to add the value to their Vercel / Claude environment settings.`);
      }
    }
  }
  const m = text.match(PUBLIC_SECRET);
  if (m) block(`${m[0]} would expose a secret to every visitor's browser. Use a server-only variable without the NEXT_PUBLIC_ prefix.`);
}

// ---- 2. Risky shell commands ----------------------------------------------
if (tool === "Bash") {
  const cmd = ti.command || "";
  const RISKY = [
    [/git\s+push\b.*(--force\b|-f\b)/, "force-push rewrites history. Push normally or open a PR."],
    [/--no-verify\b/, "skipping git hooks bypasses safety checks."],
    [/supabase\s+db\s+reset\b.*--linked/, "this would wipe the PRODUCTION database. Ask the user explicitly first."],
    [/\b(drop\s+(table|schema|database)|truncate\s+table)\b/i, "destructive database command. Explain the impact and ask the user to confirm."],
    [/alter\s+table\s+\S+\s+disable\s+row\s+level\s+security/i, "disabling row-level security exposes user data."],
    [/\brm\s+-rf?\s+(\/|~|\.)(\s|$)/, "recursive delete of a root/home/project directory."],
    [/\b(cat|less|more|head|tail)\s+[^|;&]*\.env(\.[a-z]+)?(?<!\.example)(\s|$|[|;&])/, "reading .env files would print secrets into the chat."],
    [/^\s*(printenv|env)\s*$/, "dumping all environment variables would print secrets into the chat."],
    [/curl[^|]*\|\s*(ba|z)?sh\b/, "piping a downloaded script straight into a shell."],
  ];
  for (const [re, why] of RISKY) if (re.test(cmd)) block(why);
}

process.exit(0);
