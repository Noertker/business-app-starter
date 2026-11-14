// Payment safety: forged/wrong-mode webhooks are rejected, database failures make
// Stripe retry (instead of silently losing a paid upgrade), and an existing
// subscriber can't be billed twice.
import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "whsec_test_secret";
process.env.STRIPE_WEBHOOK_SECRET = SECRET;
process.env.STRIPE_SECRET_KEY = "sk_test_unit";
process.env.STRIPE_PRICE_ID = "price_unit";

// ---- fake database (the admin client used by the webhook) ----
const dbResult = { error: null as null | { message: string } };
const calls: { op: string; values: unknown }[] = [];
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      upsert: async (values: unknown) => (calls.push({ op: "upsert", values }), dbResult),
      update: (values: unknown) => ({
        eq: async () => (calls.push({ op: "update", values }), dbResult),
      }),
    }),
  }),
}));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(), receiptEmail: () => "" }));

const { POST } = await import("@/app/api/stripe/webhook/route");
const { stripe } = await import("@/lib/stripe");

function signed(event: Record<string, unknown>, secret = SECRET) {
  const payload = JSON.stringify({ id: "evt_1", object: "event", livemode: false, ...event });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request("http://x/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": header } });
}
const subDeleted = {
  type: "customer.subscription.deleted",
  data: { object: { id: "sub_1", object: "subscription", status: "canceled", items: { data: [{ price: { id: "price_x" } }] } } },
};

beforeEach(() => {
  dbResult.error = null;
  calls.length = 0;
});

describe("stripe webhook", () => {
  it("rejects a forged signature", async () => {
    expect((await POST(signed(subDeleted, "whsec_wrong"))).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("rejects a live-mode event on a test-mode deployment", async () => {
    expect((await POST(signed({ ...subDeleted, livemode: true }))).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("updates the subscription status", async () => {
    expect((await POST(signed(subDeleted))).status).toBe(200);
    expect(calls[0]).toMatchObject({ op: "update", values: { status: "canceled" } });
  });

  it("returns 500 when the database fails, so Stripe retries", async () => {
    dbResult.error = { message: "db down" };
    expect((await POST(signed(subDeleted))).status).toBe(500);
  });

  it("returns 500 when saving a new subscription fails, so the customer isn't lost", async () => {
    vi.spyOn(stripe().subscriptions, "retrieve").mockResolvedValue({
      id: "sub_1", status: "active", items: { data: [{ price: { id: "price_x" } }] },
    } as never);
    dbResult.error = { message: "db down" };
    const res = await POST(signed({
      type: "checkout.session.completed",
      data: { object: { object: "checkout.session", mode: "subscription", client_reference_id: "user_1", customer: "cus_1", subscription: "sub_1" } },
    }));
    expect(res.status).toBe(500);
    expect(calls[0]).toMatchObject({ op: "upsert", values: { user_id: "user_1", status: "active" } });
  });
});

describe("checkout", () => {
  it("sends an existing subscriber to the billing portal instead of charging twice", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth", () => ({ requireUser: async () => ({ id: "user_1", email: "a@b.c" }) }));
    vi.doMock("@/lib/subscription", () => ({
      getSubscription: async () => ({ status: "active", stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1" }),
      isActive: (s: string) => s === "active",
    }));
    vi.doMock("next/headers", () => ({ headers: async () => new Headers({ origin: "https://app.test" }) }));
    vi.doMock("next/navigation", () => ({
      redirect: (url: string) => { throw Object.assign(new Error("REDIRECT"), { url }); },
    }));
    const { stripe: s } = await import("@/lib/stripe");
    const checkout = vi.spyOn(s().checkout.sessions, "create");
    const portal = vi.spyOn(s().billingPortal.sessions, "create").mockResolvedValue({ url: "https://billing.stripe.com/p/x" } as never);
    const { startCheckout } = await import("@/app/pricing/actions");

    await expect(startCheckout()).rejects.toMatchObject({ url: "https://billing.stripe.com/p/x" });
    expect(portal).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_1" }));
    expect(checkout).not.toHaveBeenCalled();
  });
});
