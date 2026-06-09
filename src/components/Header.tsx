import Link from "next/link";
import { logout } from "@/app/actions";
import type { User } from "@prisma/client";

export function Header({ user }: { user: User }) {
  const home = user.role === "PARENT" ? "/parent" : "/child";
  const roleLabel = user.role === "PARENT" ? "Parent" : "Child";
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3">
        <Link href={home} className="font-semibold tracking-tight">
          Chore Checker <span className="text-indigo-600">AI</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-600">
            {roleLabel}: <span className="font-medium text-slate-900">{user.name}</span>
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-slate-200 px-2.5 py-1 text-slate-600 transition hover:bg-slate-50"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
