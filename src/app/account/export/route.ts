import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Lets users download all of their data (a common legal requirement). */
export async function GET() {
  const user = await requireUser();
  const supabase = await createClient(); // acts as the user, so RLS limits this to their rows

  const [customers, subscription] = await Promise.all([
    supabase.from("customers").select("id, name, email, notes, created_at"),
    supabase.from("subscriptions").select("status, price_id, updated_at").maybeSingle(),
  ]);
  if (customers.error || subscription.error) {
    return new Response("Export failed. Please try again.", { status: 500 });
  }

  const body = JSON.stringify(
    { exported_at: new Date().toISOString(), account: user, subscription: subscription.data, customers: customers.data },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="my-data.json"',
      "Cache-Control": "private, no-store",
    },
  });
}
