import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const user = (await getCurrentUser())!;
  const children = await prisma.user.findMany({
    where: { role: "CHILD", parentId: user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { choresAssigned: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/parent" className="text-sm text-slate-500 hover:text-slate-700">
          ‹ Back
        </Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Your kids</h1>
          <Link
            href="/parent/children/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Add child
          </Link>
        </div>
      </div>

      {children.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          No kids yet. Add one to start assigning chores.
        </p>
      ) : (
        <ul className="space-y-3">
          {children.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-slate-500">
                  @{c.username} · {c._count.choresAssigned} chore
                  {c._count.choresAssigned === 1 ? "" : "s"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
