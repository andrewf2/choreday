import Link from "next/link";
import { redirect } from "next/navigation";
import { signup } from "@/app/actions";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  missing: "Please fill in your name, a username, and a password.",
  username:
    "Username must be 3–20 characters: lowercase letters, numbers, or underscores.",
  short: "Password must be at least 6 characters.",
  match: "Passwords don't match.",
  taken: "That username is already taken.",
};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const current = await getCurrentUser();
  if (current) redirect(current.role === "PARENT" ? "/parent" : "/child");

  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create your family</h1>
        <p className="mt-2 text-ink-soft">
          Sign up as a parent. You can add your kids once you&rsquo;re in.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {ERRORS[error] ?? "Something went wrong. Please try again."}
        </p>
      )}

      <form
        action={signup}
        className="space-y-4 card p-6"
      >
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
            Your name
          </label>
          <input id="name" name="name" required placeholder="Sam" className={inputClass} />
        </div>
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
            placeholder="sam"
            className={inputClass}
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
            autoComplete="new-password"
            required
            minLength={6}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="confirm"
            className="mb-1 block text-sm font-medium text-ink"
          >
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/" className="font-medium text-coral hover:text-coral">
          Log in
        </Link>
      </p>
    </main>
  );
}
