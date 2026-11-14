import Link from "next/link";

export const metadata = { title: "Privacy policy" };

// ✏️ TEMPLATE. Not legal advice. Ask Claude to fill in the [brackets], then have
// it reviewed if you handle sensitive data (health, finance, children) or sell
// into regions with strict privacy laws (e.g. the EU/UK under GDPR, California under CCPA).
export default function PrivacyPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Privacy policy</h1>
      <p className="opacity-70">Last updated: [DATE]</p>

      <h2 className="text-xl font-semibold">Who we are</h2>
      <p>[BUSINESS NAME] (&ldquo;we&rdquo;) runs this website. Contact us at [CONTACT EMAIL].</p>

      <h2 className="text-xl font-semibold">What we collect</h2>
      <ul className="list-disc pl-5">
        <li><strong>Account:</strong> your email address, used to sign you in.</li>
        <li><strong>Your content:</strong> what you add in the app (for example, customer records).</li>
        <li><strong>Payments:</strong> handled by Stripe. We never see or store your full card number.</li>
      </ul>

      <h2 className="text-xl font-semibold">Who processes it for us</h2>
      <ul className="list-disc pl-5">
        <li>Supabase: database and sign-in</li>
        <li>Vercel: website hosting</li>
        <li>Stripe: payments</li>
        <li>Resend: email delivery</li>
      </ul>
      <p>We don&apos;t sell your personal information.</p>

      <h2 className="text-xl font-semibold">Your choices</h2>
      <p>
        You can download all of your data or permanently delete your account at any time from your{" "}
        <Link className="underline" href="/account">account page</Link>.
      </p>

      <h2 className="text-xl font-semibold">How long we keep it</h2>
      <p>Until you delete your account. Backups are kept for up to [NUMBER] days.</p>
    </article>
  );
}
