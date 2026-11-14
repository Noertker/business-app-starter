"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getSubscription } from "@/lib/subscription";

/**
 * Starts a Stripe Checkout. The price comes from the SERVER (env var), never
 * from the browser, so nobody can change what they pay.
 */
export async function startCheckout() {
  const user = await requireUser();
  const existing = await getSubscription();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    client_reference_id: user.id,
    ...(existing?.stripe_customer_id
      ? { customer: existing.stripe_customer_id }
      : { customer_email: user.email }),
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/pricing`,
  });

  redirect(session.url!);
}
