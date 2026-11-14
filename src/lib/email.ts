import "server-only";
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

/**
 * Sends an email from server code only. Failures are logged, never silent,
 * and never crash the request that triggered them.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set; skipping email:", subject);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) console.error("[email] failed:", subject, error.message);
}

export function receiptEmail(planName: string) {
  return `<p>Thanks for subscribing to <strong>${escapeHtml(planName)}</strong>!</p>
<p>You can manage your account any time from your dashboard.</p>`;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
