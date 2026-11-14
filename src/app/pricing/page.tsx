import { startCheckout } from "./actions";

export const metadata = { title: "Pricing" };

// ✏️ Ask Claude to change the plan name, price and features.
export default function PricingPage() {
  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <div className="max-w-sm space-y-4 rounded-xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-xl font-semibold">Pro</h2>
        <p className="text-4xl font-bold">$10<span className="text-base font-normal opacity-70">/month</span></p>
        <ul className="list-disc space-y-1 pl-5 opacity-80">
          <li>Everything in Free</li>
          <li>Unlimited customers</li>
          <li>Priority support</li>
        </ul>
        <form action={startCheckout}>
          <button className="w-full rounded-lg bg-foreground px-4 py-3 font-medium text-background">Upgrade to Pro</button>
        </form>
        <p className="text-xs opacity-60">In test mode, pay with card 4242 4242 4242 4242, any future date, any CVC.</p>
      </div>
    </section>
  );
}
