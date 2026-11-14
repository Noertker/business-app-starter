"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getSubscription, isActive } from "@/lib/subscription";

async function siteOrigin() {
  return (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
}

/**
 * Starts a Stripe Checkout. The price comes from the SERVER (env var), never
 * from the browser, so nobody can change what they pay.
 */
export async function startCheckout() {
  const user = await requireUser();
  const existing = await getSubscription();

  // Already subscribed? Never create a second subscription (double billing).
  if (existing?.stripe_customer_id && isActive(existing.status)) {
    return openBillingPortal();
  }

  const origin = await siteOrigin();
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    client_reference_id: user.id,
    ...(existing?.stripe_customer_id
      ? { customer: existing.stripe_customer_id }
      : { customer_email: user.email || undefined }),
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/pricing`,
  });

  redirect(session.url!);
}

/** Stripe's hosted page where customers update cards, see invoices or cancel. */
export async function openBillingPortal() {
  await requireUser();
  const existing = await getSubscription(); // RLS: only the signed-in user's row
  if (!existing?.stripe_customer_id) redirect("/pricing");

  const portal = await stripe().billingPortal.sessions.create({
    customer: existing.stripe_customer_id,
    return_url: `${await siteOrigin()}/dashboard`,
  });
  redirect(portal.url);
}
