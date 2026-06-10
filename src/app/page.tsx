import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Already signed in? Go straight to the right dashboard.
  const current = await getCurrentUser();
  if (current) redirect(current.role === "PARENT" ? "/parent" : "/child");

  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Chore Checker AI</h1>
        <p className="mt-2 text-ink-soft">Log in to continue.</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error === "missing"
            ? "Please enter your username and password."
            : "Incorrect username or password."}
        </p>
      )}

      <form
        action={login}
        className="space-y-4 card p-6"
      >
        <div>
          <label
            htmlFor="username"
            className="mb-1 block text-sm font-medium text-ink"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            required
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-ink"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
        >
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-coral hover:text-coral"
        >
          Create a family account
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-ink-soft">
        Demo logins: <span className="font-mono">sam</span>,{" "}
        <span className="font-mono">ava</span>,{" "}
        <span className="font-mono">leo</span> — password{" "}
        <span className="font-mono">password</span>
      </p>
    </main>
  );
}
