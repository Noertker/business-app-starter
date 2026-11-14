import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Read the signed-in user's plan. Row-level security only lets them see their own row. */
export async function getSubscription() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, price_id, stripe_customer_id, stripe_subscription_id")
    .maybeSingle();
  if (error) throw new Error(`loading subscription failed: ${error.message}`);
  return data;
}

export function isActive(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}
