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
        <Link href="/parent" className="text-sm text-ink-soft hover:text-ink">
          ‹ Back
        </Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Your kids</h1>
          <Link
            href="/parent/children/new"
            className="btn-primary"
          >
            + Add child
          </Link>
        </div>
      </div>

      {children.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/5 p-4 text-sm text-ink-soft">
          No kids yet. Add one to start assigning chores.
        </p>
      ) : (
        <ul className="space-y-3">
          {children.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between card p-4"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-ink-soft">
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
