"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, null);

  return (
    <form action={action} className="space-y-3">
      <input
        type="email"
        name="email"
        required
        placeholder="you@example.com"
        aria-label="Email address"
        className="w-full rounded-lg border border-black/15 bg-transparent px-4 py-3 dark:border-white/20"
      />
      <button
        disabled={pending}
        className="w-full rounded-lg bg-foreground px-4 py-3 font-medium text-background disabled:opacity-60"
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
      {state && (
        <p role="status" className={state.ok ? "text-green-600" : "text-red-600"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
