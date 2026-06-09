import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createChore } from "@/app/parent/actions";
import { ChoreForm } from "@/app/parent/chores/ChoreForm";

export const dynamic = "force-dynamic";

export default async function NewChorePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { error } = await searchParams;
  const children = await prisma.user.findMany({
    where: { role: "CHILD", parentId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/parent" className="text-sm text-slate-500 hover:text-slate-700">
          ‹ Back
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">New chore</h1>
        <p className="text-sm text-slate-500">
          Define exactly what &ldquo;done&rdquo; means so the AI can check it.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error === "child"
            ? "Please choose a valid child."
            : "Please fill in a name, definition of done, at least one standard, and an assigned child."}
        </p>
      )}

      {children.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          You have no children profiles yet.
        </p>
      ) : (
        <ChoreForm
          action={createChore}
          childUsers={children}
          submitLabel="Create chore"
          submittingLabel="Creating…"
        />
      )}
    </div>
  );
}
