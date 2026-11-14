import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-sm space-y-6 py-10">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="opacity-80">No password needed. We&apos;ll email you a link.</p>
      <LoginForm />
    </section>
  );
}
