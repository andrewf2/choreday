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
        <p className="mt-2 text-slate-600">Log in to continue.</p>
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
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="username"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          Create a family account
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-slate-400">
        Demo logins: <span className="font-mono">sam</span>,{" "}
        <span className="font-mono">ava</span>,{" "}
        <span className="font-mono">leo</span> — password{" "}
        <span className="font-mono">password</span>
      </p>
    </main>
  );
}
