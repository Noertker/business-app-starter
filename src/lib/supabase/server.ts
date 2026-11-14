import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Acts AS the signed-in user, so row-level security applies. Create a new one per request.
 */
export async function createClient() {
  // Auth checks depend on the current time and request, so always run them at
  // request time (required by Next.js Cache Components).
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies can't be set.
            // Safe to ignore: src/proxy.ts refreshes the session cookie.
          }
        },
      },
    },
  );
}
