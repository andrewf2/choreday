"use client";

import { useEffect, useRef, useState, useTransition } from "react";

const MAX_PHOTOS = 8;

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

interface Photo {
  id: number;
  file: File;
  url: string;
}

export function SubmitForm({
  action,
  choreId,
}: {
  action: (formData: FormData) => void;
  choreId: string;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(0);

  const busy = preparing || isPending;

  // Revoke any outstanding object URLs on unmount.
  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    // Reset the input so picking the same file again still fires onChange.
    e.target.value = "";
    if (incoming.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`You can attach up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const added = incoming.slice(0, room).map((file) => ({
      id: nextId.current++,
      file,
      url: URL.createObjectURL(file),
    }));
    setError(incoming.length > room ? `Only the first ${MAX_PHOTOS} photos were kept.` : null);
    setPhotos((prev) => [...prev, ...added]);
  }

  function removePhoto(id: number) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
    setError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (photos.length === 0) {
      setError("Please add at least one photo.");
      return;
    }

    setPreparing(true);
    try {
      const fd = new FormData();
      fd.set("choreId", choreId);
      fd.set("note", noteRef.current?.value ?? "");
      for (const p of photos) {
        fd.append("photos", await downscaleImage(p.file));
      }
      // Hand off to the server action (it redirects on completion).
      startTransition(() => action(fd));
    } catch {
      setError("Something went wrong preparing your photos. Please try again.");
      setPreparing(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFilesChange}
        className="hidden"
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-ink">
            Photos{" "}
            <span className="text-xs font-normal text-ink-soft">
              ({photos.length}/{MAX_PHOTOS})
            </span>
          </label>
          {photos.length > 0 && photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm font-semibold text-coral hover:text-coral/80"
            >
              + Add more
            </button>
          )}
        </div>

        {photos.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-black/10 bg-white px-4 py-10 text-sm font-medium text-ink-soft transition hover:border-coral/40 hover:bg-coral/5"
          >
            <span className="text-2xl">📸</span>
            Tap to take or choose photos
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p) => (
              <div key={p.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt="Selected"
                  className="aspect-square w-full rounded-2xl border border-black/5 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label="Remove photo"
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm font-bold text-white shadow-md transition hover:bg-coral"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Note <span className="text-xs font-normal text-ink-soft">(optional)</span>
        </label>
        <textarea
          ref={noteRef}
          name="note"
          rows={2}
          placeholder="Anything you want your parent or the AI to know?"
          className="w-full rounded-2xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy || photos.length === 0} className="btn-primary w-full">
        {preparing
          ? "Preparing photos…"
          : isPending
            ? "Submitting & checking with AI…"
            : `Submit ${photos.length || ""} ${photos.length === 1 ? "photo" : "photos"} for AI review`}
      </button>
    </form>
  );
}
