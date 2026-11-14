import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Read the signed-in user's plan. Row-level security only lets them see their own row. */
export async function getSubscription() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, price_id, stripe_customer_id")
    .maybeSingle();
  return data;
}

export function isActive(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}
