import Link from "next/link";
import { logout } from "@/app/actions";
import type { User } from "@prisma/client";

export function Header({ user }: { user: User }) {
  const home = user.role === "PARENT" ? "/parent" : "/child";
  const roleLabel = user.role === "PARENT" ? "Parent" : "Child";
  return (
    <header className="border-b border-black/5 bg-cream/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3">
        <Link
          href={home}
          className="font-display text-lg font-extrabold tracking-tight text-coral"
        >
          Chore Checker
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-ink-soft">
            {roleLabel}: <span className="font-semibold text-ink">{user.name}</span>
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-black/10 bg-white px-3 py-1 font-semibold text-ink-soft transition hover:bg-black/[0.03]"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
