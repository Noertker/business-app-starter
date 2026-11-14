"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/subscription";

export type DeleteState = { error: string } | null;

/**
 * Permanently deletes the signed-in user's account and all their data.
 * Stops billing FIRST, so nobody keeps getting charged for a deleted account.
 */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const user = await requireUser();
  if (formData.get("confirm") !== "DELETE") return { error: 'Type DELETE (in capitals) to confirm.' };

  const sub = await getSubscription();
  const subId = sub?.stripe_subscription_id;
  if (subId && sub.status !== "canceled") {
    try {
      await stripe().subscriptions.cancel(subId);
    } catch (err) {
      console.error("[deleteAccount] cancelling subscription failed", err);
      return { error: "We couldn't cancel your subscription, so your account wasn't deleted. Please try again or contact us." };
    }
  }

  // Deleting the login cascades to every row they own (customers, subscriptions).
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[deleteAccount]", error.message);
    return { error: "Something went wrong deleting your account. Please try again." };
  }

  await (await createClient()).auth.signOut();
  redirect("/?account=deleted");
}
