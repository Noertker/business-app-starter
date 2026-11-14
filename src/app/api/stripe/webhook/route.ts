import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
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

  const db = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        if (!userId || session.mode !== "subscription") break;

        const sub = await stripe().subscriptions.retrieve(session.subscription as string);
        // upsert = safe if Stripe sends the same event twice
        await db.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: sub.id,
          status: sub.status,
          price_id: sub.items.data[0]?.price.id ?? null,
          updated_at: new Date().toISOString(),
        });

        const email = session.customer_details?.email;
        if (email) await sendEmail(email, "Your subscription is active", receiptEmail("Pro"));
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await db
          .from("subscriptions")
          .update({
            status: sub.status,
            price_id: sub.items.data[0]?.price.id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    return new Response("Webhook handler failed", { status: 500 }); // Stripe will retry
  }

  return new Response("ok");
}
