import Link from "next/link";

export default function Home() {
  return (
    <section className="space-y-6 py-10">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your app is live. 🎉</h1>
      <p className="max-w-xl text-lg opacity-80">
        This is your starter app. It already has logins, a private customer list, payments and
        email. Open Claude Code and describe what you want to change.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded-lg bg-foreground px-5 py-3 font-medium text-background">
          Sign in
        </Link>
        <Link href="/pricing" className="rounded-lg border border-black/15 px-5 py-3 font-medium dark:border-white/20">
          See pricing
        </Link>
      </div>
    </section>
  );
}
