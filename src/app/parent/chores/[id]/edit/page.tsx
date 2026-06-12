import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { updateChore } from "@/app/parent/actions";
import { ChoreForm } from "@/app/parent/chores/ChoreForm";

export const dynamic = "force-dynamic";

export default async function EditChorePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = (await getCurrentUser())!;

  const chore = await prisma.chore.findFirst({
    where: { id, createdById: user.id },
    include: { standards: { orderBy: { order: "asc" } } },
  });
  if (!chore) notFound();

  const children = await prisma.user.findMany({
    where: { role: "CHILD", parentId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/parent/chores/${chore.id}`}
          className="text-sm text-ink-soft hover:text-ink"
        >
          ‹ Back
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Edit chore</h1>
        <p className="text-sm text-ink-soft">
          Changes apply to future submissions. Past reviews keep their original
          standards.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error === "child"
            ? "Please choose a valid child."
            : "Please fill in a name, at least one standard, and an assigned child."}
        </p>
      )}

      <ChoreForm
        action={updateChore}
        childUsers={children}
        choreId={chore.id}
        initial={{
          name: chore.name,
          assignedChildId: chore.assignedChildId,
          standards: chore.standards.map((s) => s.text),
          allowanceCents: chore.allowanceCents,
          gradingStrictness: chore.gradingStrictness,
        }}
        submitLabel="Save changes"
        submittingLabel="Saving…"
      />
    </div>
  );
}
