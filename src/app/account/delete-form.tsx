"use client";

import { useActionState } from "react";
import { deleteAccount, type DeleteState } from "./actions";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, null);

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm" htmlFor="confirm">
        Type <strong>DELETE</strong> to permanently delete your account and all your data. This can&apos;t be undone.
      </label>
      <div className="flex flex-wrap gap-3">
        <input
          id="confirm"
          name="confirm"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
        <button disabled={pending} className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white disabled:opacity-60">
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </div>
      {state?.error && <p role="alert" className="text-red-600">{state.error}</p>}
    </form>
  );
}
