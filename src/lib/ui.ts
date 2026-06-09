import type {
  ItemStatus,
  OverallStatus,
  ChoreStatus,
  SubmissionStatus,
} from "@prisma/client";

// Tailwind classes + label for a per-standard AI verdict.
export const itemStatusStyle: Record<
  ItemStatus,
  { label: string; badge: string; dot: string }
> = {
  done: {
    label: "Done",
    badge: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  not_done: {
    label: "Not done",
    badge: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
  unclear: {
    label: "Unclear",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
};

export const overallStatusStyle: Record<
  OverallStatus,
  { label: string; badge: string }
> = {
  pass: { label: "Looks good", badge: "bg-green-100 text-green-800 border-green-200" },
  needs_work: {
    label: "Needs work",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  fail: { label: "Not yet", badge: "bg-red-100 text-red-800 border-red-200" },
};

export const choreStatusStyle: Record<
  ChoreStatus,
  { label: string; badge: string }
> = {
  ACTIVE: { label: "Active", badge: "bg-blue-100 text-blue-800 border-blue-200" },
  PENDING_REVIEW: {
    label: "Pending review",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-green-100 text-green-800 border-green-200",
  },
};

export const submissionStatusStyle: Record<
  SubmissionStatus,
  { label: string; badge: string }
> = {
  PENDING_REVIEW: {
    label: "Pending review",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    badge: "bg-green-100 text-green-800 border-green-200",
  },
  REJECTED: { label: "Rejected", badge: "bg-red-100 text-red-800 border-red-200" },
};

export function formatDate(d: Date): string {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
