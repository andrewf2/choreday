import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { reassignChore, reactivateChore } from "@/app/parent/actions";
import {
  choreStatusStyle,
  submissionStatusStyle,
  overallStatusStyle,
  formatDate,
  formatMoney,
} from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ParentChoreDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;

  const chore = await prisma.chore.findFirst({
    where: { id, createdById: user.id },
    include: {
      assignedChild: true,
      standards: { orderBy: { order: "asc" } },
      submissions: {
        orderBy: { createdAt: "desc" },
        include: { photos: true },
      },
    },
  });
  if (!chore) notFound();

  const children = await prisma.user.findMany({
    where: { role: "CHILD", parentId: user.id },
    orderBy: { name: "asc" },
  });

  const status = choreStatusStyle[chore.status];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/parent" className="text-sm text-ink-soft hover:text-ink">
          ‹ Back
        </Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{chore.name}</h1>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${status.badge}`}
            >
              {status.label}
            </span>
            {chore.status === "COMPLETED" && (
              <form action={reactivateChore}>
                <input type="hidden" name="choreId" value={chore.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-1.5 text-sm font-semibold text-coral transition hover:bg-coral/20"
                >
                  Reactivate
                </button>
              </form>
            )}
            <Link
              href={`/parent/chores/${chore.id}/edit`}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-ink shadow-sm transition hover:bg-black/[0.03]"
            >
              Edit
            </Link>
          </div>
        </div>
        <p className="text-sm text-ink-soft">
          Assigned to {chore.assignedChild.name}
          {chore.allowanceCents > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-teal-dark">
                {formatMoney(chore.allowanceCents)} allowance
              </span>
            </>
          )}
        </p>
      </div>

      <section className="rounded-xl border border-black/5 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-ink">Standards</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-ink">
          {chore.standards.map((s) => (
            <li key={s.id}>{s.text}</li>
          ))}
        </ul>
      </section>

      {children.length > 1 && (
        <form
          action={reassignChore}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-black/5 bg-white p-4"
        >
          <input type="hidden" name="choreId" value={chore.id} />
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-ink">
              Reassign to
            </label>
            <select
              name="assignedChildId"
              defaultValue={chore.assignedChildId}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ink shadow-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-secondary">
            Reassign
          </button>
        </form>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Submissions ({chore.submissions.length})
        </h2>
        {chore.submissions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-black/5 p-4 text-sm text-ink-soft">
            No submissions yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {chore.submissions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/parent/review/${s.id}`}
                  className="flex items-center justify-between card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(s.createdAt)}
                      {s.photos.length > 1 && ` · ${s.photos.length} photos`}
                    </p>
                    {s.aiOverallStatus && (
                      <p className="text-sm text-ink-soft">
                        AI: {overallStatusStyle[s.aiOverallStatus].label}
                        {s.aiScore != null && ` · ${s.aiScore}/100`}
                        {s.parentOverridden && " · overridden"}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${submissionStatusStyle[s.status].badge}`}
                  >
                    {submissionStatusStyle[s.status].label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
