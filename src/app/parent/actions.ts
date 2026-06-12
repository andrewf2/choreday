"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { deleteUpload } from "@/lib/storage";
import {
  hashPassword,
  normalizeUsername,
  isValidUsername,
  isUsernameTaken,
  MIN_PASSWORD_LENGTH,
} from "@/lib/auth";

// Parse a dollar string ("2.50") into whole cents. Clamps junk/negatives to 0.
function dollarsToCents(raw: FormDataEntryValue | null): number {
  const n = parseFloat(String(raw ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

// Parse the grading strictness slider (1..5), defaulting to 3.
function parseStrictness(raw: FormDataEntryValue | null): number {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, n));
}

// Create a child account linked to the signed-in parent.
export async function createChild(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/");

  const name = String(formData.get("name") ?? "").trim();
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!name || !username || !password) {
    redirect("/parent/children/new?error=missing");
  }
  if (!isValidUsername(username)) {
    redirect("/parent/children/new?error=username");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    redirect("/parent/children/new?error=short");
  }
  if (await isUsernameTaken(username)) {
    redirect("/parent/children/new?error=taken");
  }

  await prisma.user.create({
    data: {
      name,
      username,
      passwordHash: await hashPassword(password),
      role: "CHILD",
      parentId: user.id,
    },
  });

  revalidatePath("/parent");
  redirect("/parent/children");
}

// Reassign a chore to a different child in the family. Parent-only.
export async function reassignChore(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/");

  const choreId = String(formData.get("choreId") ?? "");
  const newChildId = String(formData.get("assignedChildId") ?? "");

  const chore = await prisma.chore.findFirst({
    where: { id: choreId, createdById: user.id },
  });
  if (!chore) redirect("/parent");

  // The new assignee must be one of this parent's children.
  const child = await prisma.user.findFirst({
    where: { id: newChildId, role: "CHILD", parentId: user.id },
  });
  if (child && newChildId !== chore.assignedChildId) {
    await prisma.chore.update({
      where: { id: choreId },
      data: { assignedChildId: newChildId },
    });
  }

  revalidatePath("/parent");
  revalidatePath(`/parent/chores/${choreId}`);
  redirect(`/parent/chores/${choreId}`);
}

// Remove a child account and all of their data (chores, submissions, photos,
// payouts). Parent-only. Destructive and irreversible.
export async function deleteChild(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/");

  const childId = String(formData.get("childId") ?? "");
  const child = await prisma.user.findFirst({
    where: { id: childId, role: "CHILD", parentId: user.id },
  });
  if (!child) redirect("/parent/children");

  // Collect the child's photo paths so we can delete the files after the rows.
  const photos = await prisma.submissionPhoto.findMany({
    where: { submission: { childId } },
    select: { path: true },
  });

  // Delete dependents first (FKs aren't cascade-from-User), then the user.
  await prisma.$transaction([
    prisma.submission.deleteMany({ where: { childId } }), // cascades photos + itemResults
    prisma.chore.deleteMany({ where: { assignedChildId: childId } }), // cascades standards
    prisma.payout.deleteMany({ where: { childId } }),
    prisma.user.delete({ where: { id: childId } }),
  ]);

  // Remove the orphaned photo files from disk (privacy: kids' photos go too).
  await Promise.all(photos.map((p) => deleteUpload(p.path)));

  revalidatePath("/parent");
  revalidatePath("/parent/children");
  redirect("/parent/children");
}

// Create a chore with its checklist standards. Parent-only.
export async function createChore(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/");

  const name = String(formData.get("name") ?? "").trim();
  const assignedChildId = String(formData.get("assignedChildId") ?? "");
  const allowanceCents = dollarsToCents(formData.get("allowance"));
  const gradingStrictness = parseStrictness(formData.get("strictness"));
  const standards = formData
    .getAll("standards")
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);

  if (!name || !assignedChildId || standards.length === 0) {
    redirect("/parent/chores/new?error=missing");
  }

  // Ensure the assigned child belongs to this parent.
  const child = await prisma.user.findFirst({
    where: { id: assignedChildId, role: "CHILD", parentId: user.id },
  });
  if (!child) redirect("/parent/chores/new?error=child");

  const chore = await prisma.chore.create({
    data: {
      name,
      assignedChildId,
      allowanceCents,
      gradingStrictness,
      createdById: user.id,
      status: "ACTIVE",
      standards: {
        create: standards.map((text, order) => ({ text, order })),
      },
    },
  });

  revalidatePath("/parent");
  redirect(`/parent/chores/${chore.id}`);
}

// Edit an existing chore's details and standards. Parent-only.
export async function updateChore(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/");

  const choreId = String(formData.get("choreId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const assignedChildId = String(formData.get("assignedChildId") ?? "");
  const allowanceCents = dollarsToCents(formData.get("allowance"));
  const gradingStrictness = parseStrictness(formData.get("strictness"));
  const standards = formData
    .getAll("standards")
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);

  // Confirm the chore belongs to this parent.
  const existing = await prisma.chore.findFirst({
    where: { id: choreId, createdById: user.id },
  });
  if (!existing) redirect("/parent");

  if (!name || !assignedChildId || standards.length === 0) {
    redirect(`/parent/chores/${choreId}/edit?error=missing`);
  }

  const child = await prisma.user.findFirst({
    where: { id: assignedChildId, role: "CHILD", parentId: user.id },
  });
  if (!child) redirect(`/parent/chores/${choreId}/edit?error=child`);

  // Replace the checklist standards wholesale. Past submissions keep their own
  // copy of the standard text (ItemResult.standardText), so they're unaffected.
  await prisma.$transaction([
    prisma.standard.deleteMany({ where: { choreId } }),
    prisma.chore.update({
      where: { id: choreId },
      data: {
        name,
        assignedChildId,
        allowanceCents,
        gradingStrictness,
        standards: {
          create: standards.map((text, order) => ({ text, order })),
        },
      },
    }),
  ]);

  revalidatePath("/parent");
  revalidatePath(`/parent/chores/${choreId}`);
  redirect(`/parent/chores/${choreId}`);
}

// Approve or reject a submission. Final authority rests with the parent.
export async function reviewSubmission(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/");

  const submissionId = String(formData.get("submissionId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!submissionId || (decision !== "approve" && decision !== "reject")) {
    redirect("/parent");
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { chore: true },
  });
  if (!submission || submission.chore.createdById !== user.id) {
    redirect("/parent");
  }

  // The decision is an override if it contradicts the AI's overall verdict.
  const aiSaysPass = submission.aiOverallStatus === "pass";
  const overridden =
    submission.aiOverallStatus != null &&
    ((decision === "approve" && !aiSaysPass) ||
      (decision === "reject" && aiSaysPass));

  // Credit the chore's allowance to the child only on a fresh approval.
  const creditCents =
    decision === "approve" && submission.status === "PENDING_REVIEW"
      ? submission.chore.allowanceCents
      : 0;

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: decision === "approve" ? "APPROVED" : "REJECTED",
        parentOverridden: overridden,
        allowanceEarnedCents: creditCents,
      },
    }),
    prisma.chore.update({
      where: { id: submission.choreId },
      data: { status: decision === "approve" ? "COMPLETED" : "ACTIVE" },
    }),
    ...(creditCents > 0
      ? [
          prisma.user.update({
            where: { id: submission.childId },
            data: { allowanceBalanceCents: { increment: creditCents } },
          }),
        ]
      : []),
  ]);

  revalidatePath("/parent");
  revalidatePath("/child");
  redirect("/parent");
}

// Pay out a child's accumulated allowance: record the payout and reset to 0.
export async function payoutChild(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/");

  const childId = String(formData.get("childId") ?? "");
  const child = await prisma.user.findFirst({
    where: { id: childId, role: "CHILD", parentId: user.id },
  });
  if (!child) redirect("/parent/children");

  if (child.allowanceBalanceCents > 0) {
    await prisma.$transaction([
      prisma.payout.create({
        data: { childId: child.id, amountCents: child.allowanceBalanceCents },
      }),
      prisma.user.update({
        where: { id: child.id },
        data: { allowanceBalanceCents: 0 },
      }),
    ]);
  }

  revalidatePath("/parent/children");
  revalidatePath("/child");
  redirect("/parent/children");
}
