"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral";

export interface ChoreFormInitial {
  name: string;
  description: string;
  definitionOfDone: string;
  assignedChildId: string;
  standards: string[];
  allowanceCents: number;
}

export function ChoreForm({
  action,
  childUsers,
  initial,
  choreId,
  submitLabel,
  submittingLabel,
}: {
  action: (formData: FormData) => void;
  childUsers: { id: string; name: string }[];
  initial?: ChoreFormInitial;
  choreId?: string;
  submitLabel: string;
  submittingLabel: string;
}) {
  const [standards, setStandards] = useState<string[]>(
    initial && initial.standards.length > 0 ? initial.standards : [""],
  );
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  // Index of a standard input to focus after the next render (e.g. one we just added).
  const pendingFocus = useRef<number | null>(null);

  useEffect(() => {
    if (pendingFocus.current !== null) {
      inputsRef.current[pendingFocus.current]?.focus();
      pendingFocus.current = null;
    }
  }, [standards]);

  function updateStandard(i: number, value: string) {
    setStandards((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  }
  function addStandard() {
    pendingFocus.current = standards.length;
    setStandards((prev) => [...prev, ""]);
  }
  function removeStandard(i: number) {
    setStandards((prev) => prev.filter((_, idx) => idx !== i));
  }
  // Pressing Enter inserts a new empty standard after this one and focuses it,
  // instead of submitting the form.
  function onStandardKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number,
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      pendingFocus.current = i + 1;
      setStandards((prev) => [
        ...prev.slice(0, i + 1),
        "",
        ...prev.slice(i + 1),
      ]);
    }
  }

  return (
    <form action={action} className="space-y-5">
      {choreId && <input type="hidden" name="choreId" value={choreId} />}

      <Field label="Chore name">
        <input
          name="name"
          required
          defaultValue={initial?.name}
          placeholder="Clean Bedroom"
          className={inputClass}
        />
      </Field>

      <Field label="Description" hint="optional">
        <textarea
          name="description"
          rows={2}
          defaultValue={initial?.description}
          placeholder="Tidy up your bedroom before dinner."
          className={inputClass}
        />
      </Field>

      <Field label="Definition of done" hint="Add as much detail as possible">
        <textarea
          name="definitionOfDone"
          rows={3}
          required
          defaultValue={initial?.definitionOfDone}
          placeholder="The room looks tidy: bed made, floor clear, nothing left out."
          className={inputClass}
        />
      </Field>

      <Field label="Assign to">
        <select
          name="assignedChildId"
          required
          defaultValue={initial?.assignedChildId ?? ""}
          className={inputClass}
        >
          {childUsers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Allowance" hint="optional reward when approved">
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
            $
          </span>
          <input
            name="allowance"
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            defaultValue={
              initial && initial.allowanceCents > 0
                ? (initial.allowanceCents / 100).toString()
                : ""
            }
            placeholder="0.00"
            className={`${inputClass} pl-7`}
          />
        </div>
      </Field>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Checklist standards
        </label>
        <p className="mb-2 text-xs text-ink-soft">
          Each is checked independently by the AI.
        </p>
        <div className="space-y-2">
          {standards.map((value, i) => (
            <div key={i} className="flex gap-2">
              <input
                name="standards"
                value={value}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                onChange={(e) => updateStandard(i, e.target.value)}
                onKeyDown={(e) => onStandardKeyDown(e, i)}
                placeholder={`Standard ${i + 1} (e.g. Bed is made) — press Enter to add another`}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeStandard(i)}
                disabled={standards.length === 1}
                className="rounded-lg border border-black/10 px-3 text-ink-soft transition hover:bg-black/[0.03] disabled:opacity-40"
                aria-label="Remove standard"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStandard}
          className="mt-2 text-sm font-medium text-coral hover:text-coral"
        >
          + Add standard
        </button>
      </div>

      <SubmitButton label={submitLabel} submittingLabel={submittingLabel} />
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-ink-soft">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function SubmitButton({
  label,
  submittingLabel,
}: {
  label: string;
  submittingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary"
    >
      {pending ? submittingLabel : label}
    </button>
  );
}
