import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { reviewSubmission } from "@/app/parent/actions";
import { SubmissionFeedback } from "@/components/SubmissionFeedback";
import { submissionStatusStyle } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ subId: string }>;
}) {
  const { subId } = await params;
  const user = (await getCurrentUser())!;

  const submission = await prisma.submission.findUnique({
    where: { id: subId },
    include: {
      chore: { include: { assignedChild: true } },
      photos: true,
      itemResults: { orderBy: { order: "asc" } },
    },
  });
  if (!submission || submission.chore.createdById !== user.id) notFound();

  const pending = submission.status === "PENDING_REVIEW";
  const statusStyle = submissionStatusStyle[submission.status];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/parent/chores/${submission.choreId}`}
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
          Submitted by {submission.chore.assignedChild.name}
          {submission.parentOverridden && " · you overrode the AI"}
        </p>
      </div>

      <SubmissionFeedback submission={submission} />

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-1 text-sm font-medium text-ink">
          You have the final say
        </p>
        <p className="mb-4 text-sm text-ink-soft">
          Approve or reject this submission. You can override the AI&rsquo;s
          assessment either way.
        </p>

        {pending ? (
          <form action={reviewSubmission} className="space-y-3">
            <input type="hidden" name="submissionId" value={submission.id} />
            <div>
              <label
                htmlFor="comment"
                className="mb-1 block text-sm font-medium text-ink"
              >
                Comment{" "}
                <span className="text-xs font-normal text-ink-soft">
                  (optional — shared with your child)
                </span>
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={2}
                placeholder="e.g. Great job! / Please redo the closet."
                className="w-full rounded-2xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="decision"
                value="approve"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700"
              >
                {submission.aiOverallStatus === "pass"
                  ? "Approve"
                  : "Approve (override AI)"}
              </button>
              <button
                type="submit"
                name="decision"
                value="reject"
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50"
              >
                {submission.aiOverallStatus === "pass"
                  ? "Reject (override AI)"
                  : "Reject"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-sm text-ink-soft">
            <p>
              You {submission.status === "APPROVED" ? "approved" : "rejected"} this
              submission.
            </p>
            {submission.parentComment && (
              <p className="rounded-lg bg-black/5 p-3 text-ink">
                <span className="font-medium">Your comment:</span>{" "}
                {submission.parentComment}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
