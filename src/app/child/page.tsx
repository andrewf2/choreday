import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { choreStatusStyle } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ChildDashboard() {
  const user = (await getCurrentUser())!;

  const chores = await prisma.chore.findMany({
    where: { assignedChildId: user.id },
    orderBy: { createdAt: "desc" },
    include: { standards: true },
  });

  const todo = chores.filter((c) => c.status === "ACTIVE");
  const waiting = chores.filter((c) => c.status === "PENDING_REVIEW");
  const done = chores.filter((c) => c.status === "COMPLETED");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hi {user.name} 👋</h1>
        <p className="text-sm text-ink-soft">Here are your chores.</p>
      </div>

      <Section title="To do" chores={todo} accent="text-blue-600" cta />
      <Section title="Waiting for review" chores={waiting} accent="text-amber-600" />
      <Section title="Completed" chores={done} accent="text-emerald-600" />

      {chores.length === 0 && (
        <p className="rounded-xl border border-dashed border-black/5 p-4 text-sm text-ink-soft">
          No chores assigned yet.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  chores,
  accent,
  cta,
}: {
  title: string;
  chores: {
    id: string;
    name: string;
    status: keyof typeof choreStatusStyle;
    standards: { id: string }[];
  }[];
  accent: string;
  cta?: boolean;
}) {
  if (chores.length === 0) return null;
  return (
    <section>
      <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${accent}`}>
        {title} ({chores.length})
      </h2>
      <ul className="space-y-3">
        {chores.map((c) => (
          <li key={c.id}>
            <Link
              href={`/child/chores/${c.id}`}
              className="flex items-center justify-between card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-ink-soft">
                  {c.standards.length} standard
                  {c.standards.length === 1 ? "" : "s"} to meet
                </p>
              </div>
              {cta ? (
                <span className="pill bg-coral text-white">
                  Open
                </span>
              ) : (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${choreStatusStyle[c.status].badge}`}
                >
                  {choreStatusStyle[c.status].label}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
