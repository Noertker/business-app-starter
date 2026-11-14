"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const NewCustomer = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.union([z.email().max(320), z.literal("")]).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export async function addCustomer(formData: FormData) {
  const user = await requireUser(); // every action re-checks who's signed in
  const parsed = NewCustomer.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("customers").insert({
    owner_id: user.id, // RLS also enforces this matches the signed-in user
    name: parsed.data.name,
    email: parsed.data.email || null,
    notes: parsed.data.notes || null,
  });
  if (error) console.error("[addCustomer]", error.message);
  refresh();
}

export async function deleteCustomer(formData: FormData) {
  await requireUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const supabase = await createClient();
  // No owner check needed here: RLS silently ignores rows you don't own.
  const { error } = await supabase.from("customers").delete().eq("id", id.data);
  if (error) console.error("[deleteCustomer]", error.message);
  refresh();
}
