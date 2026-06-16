import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { SubmissionFeedback } from "@/components/SubmissionFeedback";
import { submissionStatusStyle } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ChildSubmissionView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;

  const submission = await prisma.submission.findFirst({
    where: { id, childId: user.id },
    include: {
      chore: true,
      photos: true,
      itemResults: { orderBy: { order: "asc" } },
    },
  });
  if (!submission) notFound();

  const statusStyle = submissionStatusStyle[submission.status];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/child/chores/${submission.choreId}`}
          className="text-sm text-ink-soft hover:text-ink"
        >
          ‹ Back to chore
        </Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {submission.chore.name}
          </h1>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyle.badge}`}
          >
            {statusStyle.label}
          </span>
        </div>
        <p className="text-sm text-ink-soft">
          {submission.status === "PENDING_REVIEW"
            ? "Here's the AI's check. Your parent will make the final call."
            : submission.status === "APPROVED"
              ? "Approved by your parent — nice work!"
              : "Your parent asked you to try again."}
        </p>
      </div>

      {submission.parentComment && (
        <div className="card p-4">
          <p className="text-sm font-semibold text-ink">Note from your parent</p>
          <p className="mt-1 text-sm text-ink">{submission.parentComment}</p>
        </div>
      )}

      <SubmissionFeedback submission={submission} />

      {submission.status === "REJECTED" && (
        <Link
          href={`/child/chores/${submission.choreId}/submit`}
          className="btn-primary w-full"
        >
          Try again
        </Link>
      )}
    </div>
  );
}
