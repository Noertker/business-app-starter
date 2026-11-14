"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { ok: boolean; message: string } | null;

const Email = z.email().max(320);

/** Sends a magic sign-in link. Supabase rate-limits these emails automatically. */
export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = Email.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address." };

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/dashboard` },
  });

  if (error) {
    console.error("[login]", error.message);
    return { ok: false, message: "Couldn't send the link. Please try again in a minute." };
  }
  // Same message whether or not the account exists, so emails can't be probed.
  return { ok: true, message: "Check your email for a sign-in link." };
}
