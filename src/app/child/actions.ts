"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { saveUpload, isSupportedImageType } from "@/lib/storage";
import {
  evaluateSubmission,
  type PhotoInput,
  type EvaluationResult,
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

  // Read photos into memory ONLY — nothing is written to disk until the
  // child-safety check passes, so a photo with a person is never persisted.
  const pending: { bytes: Buffer; mediaType: string }[] = [];
  const aiPhotos: PhotoInput[] = [];
  for (const file of files) {
    if (!isSupportedImageType(file.type)) continue;
    const bytes = Buffer.from(await file.arrayBuffer());
    pending.push({ bytes, mediaType: file.type });
    aiPhotos.push({
      data: bytes.toString("base64"),
      mediaType: file.type as PhotoInput["mediaType"],
    });
  }

  if (pending.length === 0) {
    redirect(`/child/chores/${choreId}/submit?error=type`);
  }

  // Run the AI evaluation (includes the child-safety person check) BEFORE
  // storing anything. redirect() throws, so call it outside the try/catch.
  let result: EvaluationResult | null = null;
  try {
    result = await evaluateSubmission(
      {
        name: chore.name,
        description: chore.description,
        definitionOfDone: chore.definitionOfDone,
        standards: chore.standards.map((s) => s.text),
        childNote: note,
      },
      aiPhotos,
    );
  } catch {
    result = null;
  }

  // If we couldn't check the photo, don't keep it — ask the child to retry.
  if (!result) {
    redirect(`/child/chores/${choreId}/submit?error=aifail`);
  }
  // Child safety: a person is visible — reject and store nothing.
  if (result.containsPerson) {
    redirect(`/child/chores/${choreId}/submit?error=person`);
  }

  // Safe to persist now: write the photos and create the submission.
  const savedPhotos: { path: string; mediaType: string }[] = [];
  for (const p of pending) {
    const path = await saveUpload(p.bytes, p.mediaType);
    savedPhotos.push({ path, mediaType: p.mediaType });
  }

  const submission = await prisma.submission.create({
    data: {
      choreId,
      childId: user.id,
      note,
      status: "PENDING_REVIEW",
      aiScore: result.score,
      aiOverallStatus: result.overallStatus,
      photos: { create: savedPhotos },
      itemResults: {
        create: result.items.map((it, order) => ({
          standardText: it.standard,
          status: it.status,
          feedback: it.feedback,
          order,
        })),
      },
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
