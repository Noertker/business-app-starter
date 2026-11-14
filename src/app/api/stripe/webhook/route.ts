import type Stripe from "stripe";
import { stripe, isLiveKey } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { receiptEmail, sendEmail } from "@/lib/email";

/**
 * Stripe calls this URL when something happens (someone paid, cancelled...).
 * This is the ONLY place that grants or removes paid access.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    // Proves the request really came from Stripe. Without this, anyone could fake a payment.
    event = stripe().webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // A test-mode event must never change a live app's data (or the reverse).
  if (event.livemode !== isLiveKey()) {
    return new Response("Wrong Stripe mode for this deployment", { status: 400 });
  }

  try {
    await handle(event);
  } catch (err) {
    // A non-2xx response makes Stripe retry, so a temporary database outage
    // never leaves a paying customer without access.
    console.error("[stripe webhook]", event.type, event.id, err);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("ok");
}

async function handle(event: Stripe.Event) {
  const db = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id;
      if (!userId || session.mode !== "subscription") return;

      // Always re-read the subscription from Stripe so the stored status is current,
      // even if events arrive out of order.
      const sub = await stripe().subscriptions.retrieve(session.subscription as string);
      const { error } = await db.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: sub.id,
        status: sub.status,
        price_id: sub.items.data[0]?.price.id ?? null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(`saving subscription failed: ${error.message}`);

      const email = session.customer_details?.email;
      if (email) await sendEmail(email, "Your subscription is active", receiptEmail("Pro"));
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const { error } = await db
        .from("subscriptions")
        .update({
          status: sub.status,
          price_id: sub.items.data[0]?.price.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      if (error) throw new Error(`updating subscription failed: ${error.message}`);
      return;
    }
  }
}
