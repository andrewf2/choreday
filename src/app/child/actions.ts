"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { saveUpload, isSupportedImageType } from "@/lib/storage";
import {
  evaluateSubmission,
  type PhotoInput,
  type ItemStatus,
} from "@/lib/ai/evaluate";

// Submit a photo for a chore, run AI evaluation, and persist the result.
export async function createSubmission(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CHILD") redirect("/");

  const choreId = String(formData.get("choreId") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  const chore = await prisma.chore.findFirst({
    where: { id: choreId, assignedChildId: user.id },
    include: { standards: { orderBy: { order: "asc" } } },
  });
  if (!chore) redirect("/child");

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    redirect(`/child/chores/${choreId}/submit?error=nophoto`);
  }

  // Save photos to disk and collect base64 for the AI call.
  const savedPhotos: { path: string; mediaType: string }[] = [];
  const aiPhotos: PhotoInput[] = [];
  for (const file of files) {
    if (!isSupportedImageType(file.type)) continue;
    const bytes = Buffer.from(await file.arrayBuffer());
    const path = await saveUpload(bytes, file.type);
    savedPhotos.push({ path, mediaType: file.type });
    aiPhotos.push({
      data: bytes.toString("base64"),
      mediaType: file.type as PhotoInput["mediaType"],
    });
  }

  if (savedPhotos.length === 0) {
    redirect(`/child/chores/${choreId}/submit?error=type`);
  }

  // Run the AI evaluation. On failure, fall back to manual review.
  let aiScore: number | null = null;
  let aiOverallStatus: "pass" | "needs_work" | "fail" | null = null;
  let aiError: string | null = null;
  let items: { standardText: string; status: ItemStatus; feedback: string; order: number }[] =
    [];

  try {
    const result = await evaluateSubmission(
      {
        name: chore.name,
        description: chore.description,
        definitionOfDone: chore.definitionOfDone,
        standards: chore.standards.map((s) => s.text),
        childNote: note,
      },
      aiPhotos,
    );
    aiScore = result.score;
    aiOverallStatus = result.overallStatus;
    items = result.items.map((it, order) => ({
      standardText: it.standard,
      status: it.status,
      feedback: it.feedback,
      order,
    }));
  } catch (err) {
    aiError =
      err instanceof Error ? err.message : "AI evaluation failed; needs manual review.";
  }

  const submission = await prisma.submission.create({
    data: {
      choreId,
      childId: user.id,
      note,
      status: "PENDING_REVIEW",
      aiScore,
      aiOverallStatus,
      aiError,
      photos: { create: savedPhotos },
      itemResults: { create: items },
    },
  });

  await prisma.chore.update({
    where: { id: choreId },
    data: { status: "PENDING_REVIEW" },
  });

  revalidatePath("/child");
  revalidatePath("/parent");
  redirect(`/child/submissions/${submission.id}`);
}
