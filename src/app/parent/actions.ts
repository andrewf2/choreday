"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  hashPassword,
  normalizeUsername,
  isValidUsername,
  isUsernameTaken,
  MIN_PASSWORD_LENGTH,
} from "@/lib/auth";

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

// Create a chore with its checklist standards. Parent-only.
export async function createChore(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "PARENT") redirect("/");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const definitionOfDone = String(formData.get("definitionOfDone") ?? "").trim();
  const assignedChildId = String(formData.get("assignedChildId") ?? "");
  const standards = formData
    .getAll("standards")
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);

  if (!name || !definitionOfDone || !assignedChildId || standards.length === 0) {
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
      description,
      definitionOfDone,
      assignedChildId,
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
  const description = String(formData.get("description") ?? "").trim();
  const definitionOfDone = String(formData.get("definitionOfDone") ?? "").trim();
  const assignedChildId = String(formData.get("assignedChildId") ?? "");
  const standards = formData
    .getAll("standards")
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);

  // Confirm the chore belongs to this parent.
  const existing = await prisma.chore.findFirst({
    where: { id: choreId, createdById: user.id },
  });
  if (!existing) redirect("/parent");

  if (!name || !definitionOfDone || !assignedChildId || standards.length === 0) {
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
        description,
        definitionOfDone,
        assignedChildId,
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

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: decision === "approve" ? "APPROVED" : "REJECTED",
        parentOverridden: overridden,
      },
    }),
    prisma.chore.update({
      where: { id: submission.choreId },
      data: { status: decision === "approve" ? "COMPLETED" : "ACTIVE" },
    }),
  ]);

  revalidatePath("/parent");
  redirect("/parent");
}
