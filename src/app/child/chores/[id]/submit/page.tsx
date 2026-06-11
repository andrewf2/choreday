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

  const errorMessages: Record<string, string> = {
    type: "That file type isn't supported. Use a JPEG, PNG, GIF, or WebP image.",
    nophoto: "Please add at least one photo.",
    person:
      "It looks like there's a person in your photo. For safety, photos can only show the chore — no people. Please retake it showing just the room or task, and try again.",
    aifail:
      "We couldn't check your photo just now. It wasn't saved — please try again in a moment.",
  };

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
          className="text-sm text-ink-soft hover:text-ink"
        >
          ‹ Back
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Submit: {chore.name}
        </h1>
        <p className="text-sm text-ink-soft">
          Take or upload a photo showing the finished chore.
        </p>
      </div>

      <section className="card p-4">
        <h2 className="mb-2 text-sm font-semibold text-ink">
          Make sure your photo shows:
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-ink-soft">
          {chore.standards.map((s) => (
            <li key={s.id}>{s.text}</li>
          ))}
        </ul>
        <p className="mt-3 rounded-lg bg-amber/15 px-3 py-2 text-xs font-medium text-amber-dark">
          📷 Photos must show only the chore — please don&rsquo;t include any people.
        </p>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessages[error] ?? "Something went wrong. Please try again."}
        </p>
      )}

      <SubmitForm action={createSubmission} choreId={chore.id} />
    </div>
  );
}
