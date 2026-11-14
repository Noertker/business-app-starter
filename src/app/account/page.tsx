import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getSubscription, isActive } from "@/lib/subscription";
import { openBillingPortal } from "@/app/pricing/actions";
import { DeleteAccountForm } from "./delete-form";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-bold">Your account</h1>
      <Suspense fallback={<p className="opacity-60">Loading…</p>}>
        <Account />
      </Suspense>
    </section>
  );
}

async function Account() {
  const user = await requireUser();
  const subscription = await getSubscription();

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="font-semibold">Plan</h2>
        <p className="opacity-80">Signed in as {user.email}. Plan: {isActive(subscription?.status) ? "Pro" : "Free"}</p>
        {subscription?.stripe_customer_id && (
          <form action={openBillingPortal}>
            <button className="rounded-lg border border-black/15 px-4 py-2 text-sm dark:border-white/20">
              Manage billing, invoices or cancel
            </button>
          </form>
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-black/10 p-5 dark:border-white/10">
        <h2 className="font-semibold">Your data</h2>
        <p className="opacity-80">Download everything we store about you as a file.</p>
        <a href="/account/export" className="inline-block rounded-lg border border-black/15 px-4 py-2 text-sm dark:border-white/20">
          Download my data
        </a>
      </div>

      <div className="space-y-3 rounded-xl border border-red-600/40 p-5">
        <h2 className="font-semibold text-red-600">Delete account</h2>
        <DeleteAccountForm />
      </div>
    </div>
  );
}
