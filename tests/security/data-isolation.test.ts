// Proves users cannot read, change or delete each other's data.
// Runs against a LOCAL Supabase (`npx supabase start`). Skipped if one isn't configured.
// Set TEST_SUPABASE_URL, TEST_SUPABASE_PUBLISHABLE_KEY, TEST_SUPABASE_SECRET_KEY
// (printed by `npx supabase status`). Never point these at production.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_SUPABASE_URL;
const anonKey = process.env.TEST_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.TEST_SUPABASE_SECRET_KEY;
const configured = Boolean(url && anonKey && secretKey);

describe.skipIf(!configured)("data isolation (row-level security)", () => {
  const admin = configured ? createClient(url!, secretKey!, { auth: { persistSession: false } }) : null!;
  const password = `Test-${crypto.randomUUID()}`;
  const ids: string[] = [];
  let a: SupabaseClient, b: SupabaseClient, anon: SupabaseClient;
  let aCustomerId: string;

  async function signedInClient(email: string) {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    ids.push(data.user.id);
    const c = createClient(url!, anonKey!, { auth: { persistSession: false } });
    const { error: e2 } = await c.auth.signInWithPassword({ email, password });
    if (e2) throw e2;
    return c;
  }

  beforeAll(async () => {
    const tag = crypto.randomUUID().slice(0, 8);
    a = await signedInClient(`a-${tag}@test.local`);
    b = await signedInClient(`b-${tag}@test.local`);
    anon = createClient(url!, anonKey!, { auth: { persistSession: false } });
    const { data, error } = await a.from("customers").insert({ name: "A's secret customer" }).select("id").single();
    if (error) throw error;
    aCustomerId = data.id;
  });

  afterAll(async () => {
    for (const id of ids) await admin.auth.admin.deleteUser(id);
  });

  it("A can read their own customer", async () => {
    const { data } = await a.from("customers").select("id").eq("id", aCustomerId);
    expect(data).toHaveLength(1);
  });

  it("B cannot read A's customer", async () => {
    const { data } = await b.from("customers").select("id").eq("id", aCustomerId);
    expect(data).toHaveLength(0);
  });

  it("B cannot edit A's customer", async () => {
    await b.from("customers").update({ name: "hacked" }).eq("id", aCustomerId);
    const { data } = await a.from("customers").select("name").eq("id", aCustomerId).single();
    expect(data?.name).toBe("A's secret customer");
  });

  it("B cannot delete A's customer", async () => {
    await b.from("customers").delete().eq("id", aCustomerId);
    const { data } = await a.from("customers").select("id").eq("id", aCustomerId);
    expect(data).toHaveLength(1);
  });

  it("B cannot create a customer owned by A", async () => {
    const { error } = await b.from("customers").insert({ name: "x", owner_id: ids[0] });
    expect(error).not.toBeNull();
  });

  it("signed-out visitors see nothing", async () => {
    const { data } = await anon.from("customers").select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("users cannot give themselves a paid plan", async () => {
    const { error } = await b.from("subscriptions").insert({ user_id: ids[1], status: "active" });
    expect(error).not.toBeNull();
  });

  it("caps how many customers one account can create", async () => {
    const rows = Array.from({ length: 1000 }, (_, i) => ({ name: `bulk ${i}` }));
    const { error: underLimit } = await b.from("customers").insert(rows);
    expect(underLimit).toBeNull();
    const { error: overLimit } = await b.from("customers").insert({ name: "one too many" });
    expect(overLimit?.message).toMatch(/limit/i);
  });

  it("deleting an account removes all of that user's data", async () => {
    const c = await signedInClient(`c-${crypto.randomUUID().slice(0, 8)}@test.local`);
    const cId = ids[ids.length - 1];
    await c.from("customers").insert({ name: "C's customer" });
    await admin.from("subscriptions").insert({ user_id: cId, status: "active" });

    await admin.auth.admin.deleteUser(cId);
    ids.pop();
    const [{ count: customers }, { count: subs }] = await Promise.all([
      admin.from("customers").select("*", { count: "exact", head: true }).eq("owner_id", cId),
      admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("user_id", cId),
    ]);
    expect(customers).toBe(0);
    expect(subs).toBe(0);
  });
});
