"use client";

import { deleteChild } from "@/app/parent/actions";

export function DeleteChildButton({
  childId,
  childName,
}: {
  childId: string;
  childName: string;
}) {
  return (
    <form
      action={deleteChild}
      onSubmit={(e) => {
        if (
          !confirm(
            `Remove ${childName}? This permanently deletes their account, chores, submissions, and photos. This can't be undone.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="childId" value={childId} />
      <button
        type="submit"
        className="text-sm font-medium text-red-600 transition hover:text-red-700"
      >
        Remove
      </button>
    </form>
  );
}
