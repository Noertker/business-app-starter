import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSubscription, isActive } from "@/lib/subscription";
import { addCustomer, deleteCustomer } from "./actions";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {/* Anything that reads the login session must sit inside <Suspense>. */}
      <Suspense fallback={<p className="opacity-60">Loading your dashboard…</p>}>
        <Dashboard />
      </Suspense>
    </section>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: customers, error }, subscription] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, email, notes, created_at")
      .order("created_at", { ascending: false }),
    getSubscription(),
  ]);

  if (error) {
    console.error("[dashboard]", error.message);
    return (
      <p role="alert" className="rounded-xl border border-red-600/40 p-4 text-red-600">
        We couldn&apos;t load your customers right now. Please refresh in a moment.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <div>
          <p className="text-sm opacity-70">Signed in as {user.email}</p>
          <p className="font-medium">
            Plan: {isActive(subscription?.status) ? "Pro ✅" : <>Free · <Link className="underline" href="/pricing">Upgrade</Link></>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/account" className="rounded-lg border border-black/15 px-4 py-2 text-sm dark:border-white/20">Account</Link>
          <form action="/auth/signout" method="post">
            <button className="rounded-lg border border-black/15 px-4 py-2 text-sm dark:border-white/20">Sign out</button>
          </form>
        </div>
      </div>

      <form action={addCustomer} className="grid gap-3 rounded-xl border border-black/10 p-4 sm:grid-cols-3 dark:border-white/10">
        <h2 className="font-semibold sm:col-span-3">Add a customer</h2>
        <input name="name" required maxLength={200} placeholder="Name" className="rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20" />
        <input name="email" type="email" maxLength={320} placeholder="Email (optional)" className="rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20" />
        <input name="notes" maxLength={5000} placeholder="Notes (optional)" className="rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20" />
        <button className="rounded-lg bg-foreground px-4 py-2 font-medium text-background sm:col-span-3">Add</button>
      </form>

      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {(customers ?? []).length === 0 && <li className="py-4 opacity-60">No customers yet. Only you can see this list.</li>}
        {(customers ?? []).map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-4 py-4">
            <div>
              <p className="font-medium">{c.name}</p>
              {c.email && <p className="text-sm opacity-70">{c.email}</p>}
              {c.notes && <p className="mt-1 text-sm">{c.notes}</p>}
            </div>
            <form action={deleteCustomer}>
              <input type="hidden" name="id" value={c.id} />
              <button className="text-sm text-red-600">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
