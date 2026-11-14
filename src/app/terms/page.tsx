export const metadata = { title: "Terms of service" };

// ✏️ TEMPLATE. Not legal advice. Ask Claude to fill in the [brackets] and adapt it to your business.
export default function TermsPage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">Terms of service</h1>
      <p className="opacity-70">Last updated: [DATE]</p>

      <p>By using [BUSINESS NAME] you agree to these terms. Questions: [CONTACT EMAIL].</p>

      <h2 className="text-xl font-semibold">Your account</h2>
      <p>Keep access to your email secure; anyone with it can sign in as you. You&apos;re responsible for what you add to the app.</p>

      <h2 className="text-xl font-semibold">Subscriptions</h2>
      <p>
        Paid plans renew automatically each [month/year] until cancelled. You can cancel any time from your account page; you keep
        access until the end of the period you paid for. [REFUND POLICY]
      </p>

      <h2 className="text-xl font-semibold">Acceptable use</h2>
      <p>Don&apos;t use the service for anything illegal, to send spam, or to try to access other people&apos;s data.</p>

      <h2 className="text-xl font-semibold">Changes and liability</h2>
      <p>
        We may update the service and these terms; we&apos;ll notify you of important changes by email. The service is provided
        &quot;as is&quot;, to the extent permitted by law. [GOVERNING LAW / JURISDICTION]
      </p>
    </article>
  );
}
