import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { payoutChild } from "@/app/parent/actions";
import { DeleteChildButton } from "@/components/DeleteChildButton";
import { formatMoney } from "@/lib/ui";

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
            <li key={c.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-ink-soft">
                    @{c.username} · {c._count.choresAssigned} chore
                    {c._count.choresAssigned === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-soft">Allowance owed</p>
                  <p className="font-display text-xl font-extrabold text-coral">
                    {formatMoney(c.allowanceBalanceCents)}
                  </p>
                </div>
              </div>
              {c.allowanceBalanceCents > 0 && (
                <form action={payoutChild} className="mt-3">
                  <input type="hidden" name="childId" value={c.id} />
                  <button type="submit" className="btn-secondary w-full">
                    Mark {formatMoney(c.allowanceBalanceCents)} paid out
                  </button>
                </form>
              )}
              <div className="mt-3 flex justify-end border-t border-black/5 pt-3">
                <DeleteChildButton childId={c.id} childName={c.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
