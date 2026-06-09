import { NextRequest } from "next/server";
import { readUpload, mimeForPath } from "@/lib/storage";

// Serves user-submitted chore photos stored under uploads/.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const relativePath = segments.join("/");
  const bytes = await readUpload(relativePath);
  if (!bytes) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mimeForPath(relativePath),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
