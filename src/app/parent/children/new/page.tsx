import Link from "next/link";
import { createChild } from "@/app/parent/actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  missing: "Please fill in a name, username, and password.",
  username:
    "Username must be 3–20 characters: lowercase letters, numbers, or underscores.",
  short: "Password must be at least 6 characters.",
  taken: "That username is already taken.",
};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral";

export default async function NewChildPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/parent/children"
          className="text-sm text-ink-soft hover:text-ink"
        >
          ‹ Back
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Add a child</h1>
        <p className="text-sm text-ink-soft">
          Create a login for your child. They&rsquo;ll use it to see chores and
          submit photos.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {ERRORS[error] ?? "Something went wrong. Please try again."}
        </p>
      )}

      <form
        action={createChild}
        className="space-y-4 card p-6"
      >
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
            Child&rsquo;s name
          </label>
          <input id="name" name="name" required placeholder="Ava" className={inputClass} />
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
            autoCapitalize="none"
            required
            placeholder="ava"
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
            required
            minLength={6}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-ink-soft">
            At least 6 characters. Share it with your child so they can log in.
          </p>
        </div>
        <button
          type="submit"
          className="btn-primary"
        >
          Add child
        </button>
      </form>
    </div>
  );
}
