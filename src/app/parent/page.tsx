import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { choreStatusStyle, overallStatusStyle, formatDate } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ParentDashboard() {
  const user = (await getCurrentUser())!;

  const chores = await prisma.chore.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      assignedChild: true,
      submissions: {
        orderBy: { createdAt: "desc" },
        include: { photos: true },
      },
    },
  });

  const pendingReviews = chores
    .flatMap((c) =>
      c.submissions
        .filter((s) => s.status === "PENDING_REVIEW")
        .map((s) => ({ chore: c, submission: s })),
    )
    .sort((a, b) => +b.submission.createdAt - +a.submission.createdAt);

  const active = chores.filter((c) => c.status === "ACTIVE");
  const completed = chores.filter((c) => c.status === "COMPLETED");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Your chores</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/parent/children"
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-black/[0.03]"
          >
            Kids
          </Link>
          <Link
            href="/parent/chores/new"
            className="btn-primary"
          >
            + New chore
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
          Pending reviews ({pendingReviews.length})
        </h2>
        {pendingReviews.length === 0 ? (
          <Empty>No submissions waiting for review.</Empty>
        ) : (
          <ul className="space-y-3">
            {pendingReviews.map(({ chore, submission }) => (
              <li key={submission.id}>
                <Link
                  href={`/parent/review/${submission.id}`}
                  className="flex items-center justify-between card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <p className="font-medium">{chore.name}</p>
                    <p className="text-sm text-ink-soft">
                      {chore.assignedChild.name} · submitted{" "}
                      {formatDate(submission.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {submission.aiOverallStatus ? (
                      <Badge
                        className={overallStatusStyle[submission.aiOverallStatus].badge}
                      >
                        AI: {overallStatusStyle[submission.aiOverallStatus].label}
                        {submission.aiScore != null && ` · ${submission.aiScore}`}
                      </Badge>
                    ) : (
                      <Badge className="bg-black/5 text-ink border-black/5">
                        Manual review
                      </Badge>
                    )}
                    <span className="text-ink-soft">›</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ChoreListSection title="Active" chores={active} />
      <ChoreListSection title="Completed" chores={completed} />
    </div>
  );
}

function ChoreListSection({
  title,
  chores,
}: {
  title: string;
  chores: {
    id: string;
    name: string;
    status: keyof typeof choreStatusStyle;
    assignedChild: { name: string };
    standards?: unknown;
  }[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
        {title} ({chores.length})
      </h2>
      {chores.length === 0 ? (
        <Empty>None yet.</Empty>
      ) : (
        <ul className="space-y-3">
          {chores.map((c) => (
            <li key={c.id}>
              <Link
                href={`/parent/chores/${c.id}`}
                className="flex items-center justify-between card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-ink-soft">{c.assignedChild.name}</p>
                </div>
                <Badge className={choreStatusStyle[c.status].badge}>
                  {choreStatusStyle[c.status].label}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-black/5 bg-white/50 p-4 text-sm text-ink-soft">
      {children}
    </p>
  );
}
