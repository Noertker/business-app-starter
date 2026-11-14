import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Server-only Stripe client. The secret key never reaches the browser. */
export function stripe() {
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}
