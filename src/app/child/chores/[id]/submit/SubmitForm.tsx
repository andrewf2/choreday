"use client";

import { useRef, useState, useTransition } from "react";

// Downscale a photo in the browser before upload: caps the long edge at 1568px
// (about the most Claude uses for vision) and re-encodes as JPEG. Cuts upload
// size and AI token cost. Converting via canvas also normalizes HEIC/etc. to JPEG.
async function downscaleImage(
  file: File,
  maxEdge = 1568,
  quality = 0.82,
): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality),
    );
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    // If anything goes wrong, fall back to the original (the server body limit
    // is the backstop).
    return file;
  }
}

export function SubmitForm({
  action,
  choreId,
}: {
  action: (formData: FormData) => void;
  choreId: string;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const busy = preparing || isPending;

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    setHasPhoto(files.length > 0);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const files = Array.from(fileRef.current?.files ?? []);
    if (files.length === 0) {
      setError("Please choose at least one photo.");
      return;
    }

    setPreparing(true);
    try {
      const fd = new FormData();
      fd.set("choreId", choreId);
      fd.set("note", noteRef.current?.value ?? "");
      for (const f of files) {
        fd.append("photos", await downscaleImage(f));
      }
      // Hand off to the server action (it redirects on completion).
      startTransition(() => action(fd));
    } catch {
      setError("Something went wrong preparing your photo. Please try again.");
      setPreparing(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Photo(s)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={onFilesChange}
          className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-coral/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-coral hover:file:bg-coral/20"
        />
      </div>

      {previews.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt="Preview"
              className="w-full rounded-xl border border-black/5 object-cover"
            />
          ))}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Note <span className="text-xs font-normal text-ink-soft">(optional)</span>
        </label>
        <textarea
          ref={noteRef}
          name="note"
          rows={2}
          placeholder="Anything you want your parent or the AI to know?"
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !hasPhoto}
        className="btn-primary w-full"
      >
        {preparing
          ? "Preparing photo…"
          : isPending
            ? "Submitting & checking with AI…"
            : "Submit for AI review"}
      </button>
    </form>
  );
}
