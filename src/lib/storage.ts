import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Photos live outside public/ so access goes through a controlled route.
// Configurable via UPLOADS_DIR (e.g. /data/uploads on the Fly volume in production).
const UPLOAD_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(process.cwd(), "uploads");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export const SUPPORTED_IMAGE_TYPES = Object.keys(EXT_BY_MIME);

export function isSupportedImageType(mime: string): boolean {
  return mime in EXT_BY_MIME;
}

// Persist an uploaded image and return its relative path (the stored value).
export async function saveUpload(
  bytes: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = EXT_BY_MIME[mimeType] ?? "bin";
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
  return name;
}

// Read a stored upload by its relative path. Guards against path traversal.
export async function readUpload(
  relativePath: string,
): Promise<Buffer | null> {
  const resolved = path.resolve(UPLOAD_DIR, relativePath);
  if (!resolved.startsWith(UPLOAD_DIR + path.sep)) return null;
  try {
    return await fs.readFile(resolved);
  } catch {
    return null;
  }
}

// Delete a stored upload by its relative path. Guards against path traversal;
// silently ignores missing files.
export async function deleteUpload(relativePath: string): Promise<void> {
  const resolved = path.resolve(UPLOAD_DIR, relativePath);
  if (!resolved.startsWith(UPLOAD_DIR + path.sep)) return;
  try {
    await fs.unlink(resolved);
  } catch {
    // already gone — fine
  }
}

export function mimeForPath(relativePath: string): string {
  const ext = path.extname(relativePath).slice(1).toLowerCase();
  const entry = Object.entries(EXT_BY_MIME).find(([, e]) => e === ext);
  return entry?.[0] ?? "application/octet-stream";
}
