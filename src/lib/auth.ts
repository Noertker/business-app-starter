import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type User = { id: string; email: string };

/**
 * The ONE place the app decides who is signed in (the "data access layer").
 * Call this in every Server Component, Server Action and Route Handler that
 * touches user data. Never trust a user id sent from the browser.
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser(); // verified with Supabase Auth
  if (error || !data.user) redirect("/login");
  return { id: data.user.id, email: data.user.email ?? "" };
}
