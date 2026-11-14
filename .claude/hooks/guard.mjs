#!/usr/bin/env node
// Security guardrail for Claude Code (PreToolUse hook).
// Catches common, serious mistakes: secrets written into code, secrets read into
// the chat, and destructive commands or SQL (from the shell OR from MCP tools).
//
// This is a safety net, not a sandbox: a determined agent could find a way
// around pattern matching. The real protection is that secrets live in Vercel /
// your Claude environment settings, not in files the agent can read, plus row-level
// security in the database and the CI checks.
//
// Exit code 2 = block the action and show the reason to Claude so it can change course.

import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const tool = input.tool_name || "";
const ti = input.tool_input || {};

// Hard stop: never allowed (secrets, disabling security).
const block = (reason) => {
  process.stderr.write(`🔒 Blocked by security guard: ${reason}\n`);
  process.exit(2);
};

// Pause and ask the owner: destructive, but sometimes legitimate (e.g. a migration).
const ask = (reason) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: `⚠️ Security guard: ${reason}`,
    },
  }));
  process.exit(0);
};

// ---- Patterns ---------------------------------------------------------------
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

// SQL that weakens security: never allowed, whether via psql, the CLI, an MCP tool or a migration file.
const FORBIDDEN_SQL = [
  [/disable\s+row\s+level\s+security|no\s+force\s+row\s+level\s+security/i, "disabling row-level security exposes user data. Fix the policy instead."],
  [/\bgrant\s+[^;]*\bto\s+(anon|public)\b/i, "granting extra permissions to signed-out visitors."],
  [/\b(update|delete\s+from|truncate(\s+table)?)\s+auth\.users\b/i, "changing login accounts directly. Use the Supabase dashboard."],
];
// SQL that destroys data: allowed only after the owner confirms.
const DESTRUCTIVE_SQL = [
  [/\bdrop\s+(table|schema|database)\b/i, "this permanently deletes a table and its data."],
  [/\btruncate(\s+table)?\s+[\w."]+/i, "this permanently deletes every row in a table."],
  [/\bdelete\s+from\s+[\w."]+\s*(;|$)/i, "DELETE without a WHERE clause wipes the whole table."],
];
function checkSql(text) {
  for (const [re, why] of FORBIDDEN_SQL) if (re.test(text)) block(why);
  for (const [re, why] of DESTRUCTIVE_SQL) if (re.test(text)) ask(why);
}

// Any mention of a real env file (anything but .env.example) in a shell command.
const ENV_FILE = /(^|[\s'"=/<>(])\.env(\.(local|development|production|test))*(\.local)?(?=$|[\s'";|&)<>])/;

// Never allowed.
const FORBIDDEN_SHELL = [
  [/git\s+push\b[^|;&]*(\s--force(-with-lease)?\b|\s-f\b|\s\+\S|--mirror\b)/, "force-pushing rewrites history. Push normally or open a PR."],
  [/--no-verify\b/, "skipping git hooks bypasses safety checks."],
  [/\brm\s+-[a-z]*r[a-z]*\s+(\/|~|\.|\*|\$HOME)(\s|$)/, "recursive delete of a root, home or project directory."],
  [/^\s*(printenv|env|export\s+-p|set)\s*$/, "dumping all environment variables would print secrets into the chat."],
  [/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b/, "piping a downloaded script straight into a shell."],
  [/\bvercel\s+env\s+pull\b/, "this downloads production secrets into a file the agent can read."],
];
// Allowed only after the owner confirms.
const DESTRUCTIVE_SHELL = [
  [/git\s+push\b[^|;&]*(--delete\b|\s:\S)/, "this deletes a branch on GitHub."],
  [/git\s+(reset\s+--hard|clean\s+-[a-z]*f)/, "this throws away uncommitted work permanently."],
  [/supabase\s+db\s+reset\b.*--linked/, "this wipes the PRODUCTION database."],
  [/supabase\s+projects\s+delete\b/, "this deletes a Supabase project."],
];

function allStrings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}

// ---- 1. Writing files ----------------------------------------------------------
if (["Write", "Edit", "MultiEdit"].includes(tool)) {
  const file = ti.file_path || "";
  const text = [ti.content, ti.new_string, ...(ti.edits || []).map((e) => e.new_string)]
    .filter(Boolean)
    .join("\n");

  if (!ALLOWED_SECRET_FILES.test(file)) {
    for (const [re, name] of SECRET_PATTERNS) {
      if (re.test(text)) {
        block(`${name} detected in ${file}. Never put secrets in code. Read them from environment variables (process.env.X) and ask the owner to add the value in Vercel → Settings → Environment Variables.`);
      }
    }
  }
  const m = text.match(PUBLIC_SECRET);
  if (m) block(`${m[0]} would expose a secret to every visitor's browser. Use a server-only variable without the NEXT_PUBLIC_ prefix.`);
  if (/\.sql$/.test(file)) checkSql(text);
}

// ---- 2. Reading secret files with the Read tool ------------------------------------
if (tool === "Read" && /(^|\/)\.env(\.[a-z.]+)?$/.test(ti.file_path || "") && !/\.example$/.test(ti.file_path || "")) {
  block("reading .env files would put secrets into the chat. Ask the owner which variable names exist instead.");
}

// ---- 3. Shell commands -------------------------------------------------------------
if (tool === "Bash") {
  const cmd = ti.command || "";
  if (ENV_FILE.test(cmd)) block("this command touches a .env file and could print secrets into the chat. Use .env.example for variable names.");
  for (const [re, why] of FORBIDDEN_SHELL) if (re.test(cmd)) block(why);
  if (/\b(psql|supabase)\b/.test(cmd)) checkSql(cmd);
  for (const [re, why] of DESTRUCTIVE_SHELL) if (re.test(cmd)) ask(why);
}

// ---- 4. MCP tools (Supabase, Stripe, Vercel...) -----------------------------------------
if (tool.startsWith("mcp__")) {
  const text = allStrings(ti).join("\n");
  for (const [re, name] of SECRET_PATTERNS) if (re.test(text)) block(`${name} in a tool call. Secrets must never be sent through the chat.`);
  checkSql(text);
  if (/^mcp__supabase__(delete_branch|pause_project|reset_branch|merge_branch)$/.test(tool)) {
    ask("this changes or removes a whole database environment.");
  }
}

process.exit(0);
