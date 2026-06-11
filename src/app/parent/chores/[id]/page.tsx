import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
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

      {chore.description && (
        <p className="text-ink">{chore.description}</p>
      )}

      <section className="rounded-xl border border-black/5 bg-white p-4">
        {chore.definitionOfDone && (
          <p className="mb-3 text-sm text-ink-soft">
            <span className="font-medium">Definition of done:</span>{" "}
            {chore.definitionOfDone}
          </p>
        )}
        <h2 className="mb-2 text-sm font-semibold text-ink">Standards</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-ink">
          {chore.standards.map((s) => (
            <li key={s.id}>{s.text}</li>
          ))}
        </ul>
      </section>

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
