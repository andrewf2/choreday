import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createSubmission } from "@/app/child/actions";
import { SubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage({
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
    where: { id, assignedChildId: user.id },
    include: { standards: { orderBy: { order: "asc" } } },
  });
  if (!chore) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/child/chores/${chore.id}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ‹ Back
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Submit: {chore.name}
        </h1>
        <p className="text-sm text-slate-500">
          Take or upload a photo showing the finished chore.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          Make sure your photo shows:
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          {chore.standards.map((s) => (
            <li key={s.id}>{s.text}</li>
          ))}
        </ul>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error === "type"
            ? "That file type isn't supported. Use a JPEG, PNG, GIF, or WebP image."
            : "Please choose at least one photo."}
        </p>
      )}

      <SubmitForm action={createSubmission} choreId={chore.id} />
    </div>
  );
}
