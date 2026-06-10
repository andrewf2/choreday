import type {
  ItemStatus,
  OverallStatus,
  ChoreStatus,
  SubmissionStatus,
} from "@prisma/client";

const TEAL = "bg-teal/15 text-teal-dark border-teal/30";
const CORAL = "bg-coral/10 text-coral border-coral/30";
const AMBER = "bg-amber/15 text-amber-dark border-amber/40";

// Tailwind classes + label for a per-standard AI verdict.
export const itemStatusStyle: Record<
  ItemStatus,
  { label: string; badge: string; dot: string }
> = {
  done: { label: "Done", badge: TEAL, dot: "bg-teal" },
  not_done: { label: "Not done", badge: CORAL, dot: "bg-coral" },
  unclear: { label: "Unclear", badge: AMBER, dot: "bg-amber" },
};

export const overallStatusStyle: Record<
  OverallStatus,
  { label: string; badge: string }
> = {
  pass: { label: "Looks good", badge: TEAL },
  needs_work: { label: "Needs work", badge: AMBER },
  fail: { label: "Not yet", badge: CORAL },
};

export const choreStatusStyle: Record<
  ChoreStatus,
  { label: string; badge: string }
> = {
  ACTIVE: { label: "Active", badge: CORAL },
  PENDING_REVIEW: { label: "Pending review", badge: AMBER },
  COMPLETED: { label: "Completed", badge: TEAL },
};

export const submissionStatusStyle: Record<
  SubmissionStatus,
  { label: string; badge: string }
> = {
  PENDING_REVIEW: { label: "Pending review", badge: AMBER },
  APPROVED: { label: "Approved", badge: TEAL },
  REJECTED: { label: "Rejected", badge: CORAL },
};

export function formatDate(d: Date): string {
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
