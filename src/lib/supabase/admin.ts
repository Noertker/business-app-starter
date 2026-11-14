import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * ⚠️ ADMIN client: BYPASSES row-level security.
 * Only use for trusted server-side jobs (e.g. Stripe webhooks) that must write
 * data no user is allowed to write. Never import this into a "use client" file.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
