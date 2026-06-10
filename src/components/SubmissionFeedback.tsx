import { itemStatusStyle, overallStatusStyle, formatDate } from "@/lib/ui";
import type { ItemStatus, OverallStatus } from "@prisma/client";

interface SubmissionForFeedback {
  createdAt: Date;
  note: string | null;
  aiScore: number | null;
  aiOverallStatus: OverallStatus | null;
  aiError: string | null;
  photos: { id: string; path: string }[];
  itemResults: {
    id: string;
    standardText: string;
    status: ItemStatus;
    feedback: string;
  }[];
}

export function SubmissionFeedback({
  submission,
}: {
  submission: SubmissionForFeedback;
}) {
  return (
    <div className="space-y-5">
      {/* Photos */}
      <div className="grid gap-3 sm:grid-cols-2">
        {submission.photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.id}
            src={`/api/uploads/${p.path}`}
            alt="Chore submission"
            className="w-full rounded-xl border border-black/5 object-cover"
          />
        ))}
      </div>

      {submission.note && (
        <p className="rounded-lg bg-black/5 p-3 text-sm text-ink">
          <span className="font-medium">Note:</span> {submission.note}
        </p>
      )}

      {/* AI result */}
      {submission.aiError ? (
        <div className="rounded-lg border border-black/5 bg-black/[0.03] p-4 text-sm text-ink-soft">
          AI evaluation couldn&rsquo;t run for this submission — it needs manual
          review.
          <span className="mt-1 block text-xs text-ink-soft">
            {submission.aiError}
          </span>
        </div>
      ) : submission.aiOverallStatus ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${overallStatusStyle[submission.aiOverallStatus].badge}`}
            >
              {overallStatusStyle[submission.aiOverallStatus].label}
            </span>
            {submission.aiScore != null && (
              <span className="text-sm text-ink-soft">
                Score: <span className="font-semibold">{submission.aiScore}</span>/100
              </span>
            )}
          </div>

          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-black/5 bg-white">
            {submission.itemResults.map((item) => {
              const style = itemStatusStyle[item.status];
              return (
                <li key={item.id} className="flex gap-3 p-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-ink">{item.standardText}</p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${style.badge}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    {item.feedback && (
                      <p className="mt-0.5 text-sm text-ink-soft">{item.feedback}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">No AI evaluation available.</p>
      )}

      <p className="text-xs text-ink-soft">
        Submitted {formatDate(submission.createdAt)}
      </p>
    </div>
  );
}
