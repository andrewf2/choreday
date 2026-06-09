import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Demo password for every seeded account.
const DEMO_PASSWORD = "password";
const hash = (pw: string) => bcrypt.hash(pw, 10);

async function wipe() {
  await prisma.itemResult.deleteMany();
  await prisma.submissionPhoto.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.standard.deleteMany();
  await prisma.chore.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  // Idempotent: if accounts already exist, do nothing. This is safe to run on
  // every container start (the Dockerfile calls it after migrate deploy) — it
  // won't wipe or duplicate data. Set SEED_FORCE=1 to wipe and reseed.
  const force = process.env.SEED_FORCE === "1";
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0 && !force) {
    console.log(
      `Seed skipped: ${existingUsers} users already exist (set SEED_FORCE=1 to reset).`,
    );
    return;
  }
  if (force) await wipe();

  const passwordHash = await hash(DEMO_PASSWORD);

  const parent = await prisma.user.create({
    data: {
      name: "Sam (Parent)",
      username: "sam",
      passwordHash,
      role: "PARENT",
    },
  });

  const ava = await prisma.user.create({
    data: {
      name: "Ava",
      username: "ava",
      passwordHash,
      role: "CHILD",
      parentId: parent.id,
    },
  });

  const leo = await prisma.user.create({
    data: {
      name: "Leo",
      username: "leo",
      passwordHash,
      role: "CHILD",
      parentId: parent.id,
    },
  });

  // Additional test accounts (password: password1234).
  // Each child links to one parent (the schema supports a single parent link),
  // so children are paired: easton -> andrew, ashton -> kelsi.
  const testHash = await hash("password1234");

  const andrew = await prisma.user.create({
    data: { name: "Andrew", username: "andrew", passwordHash: testHash, role: "PARENT" },
  });
  const kelsi = await prisma.user.create({
    data: { name: "Kelsi", username: "kelsi", passwordHash: testHash, role: "PARENT" },
  });
  await prisma.user.create({
    data: {
      name: "Easton",
      username: "easton",
      passwordHash: testHash,
      role: "CHILD",
      parentId: andrew.id,
    },
  });
  await prisma.user.create({
    data: {
      name: "Ashton",
      username: "ashton",
      passwordHash: testHash,
      role: "CHILD",
      parentId: kelsi.id,
    },
  });

  await prisma.chore.create({
    data: {
      name: "Clean Bedroom",
      description: "Tidy up your bedroom before dinner.",
      definitionOfDone:
        "The room looks tidy: bed made, floor and surfaces clear, nothing left out.",
      assignedChildId: ava.id,
      createdById: parent.id,
      status: "ACTIVE",
      standards: {
        create: [
          { text: "Bed is made", order: 0 },
          { text: "No clothes on the floor", order: 1 },
          { text: "No visible trash", order: 2 },
          { text: "Toys put away", order: 3 },
          { text: "Desk is mostly clear", order: 4 },
        ],
      },
    },
  });

  await prisma.chore.create({
    data: {
      name: "Clean Bathroom",
      description: "Give the bathroom a quick clean.",
      definitionOfDone: "The bathroom is clean and clutter-free.",
      assignedChildId: leo.id,
      createdById: parent.id,
      status: "ACTIVE",
      standards: {
        create: [
          { text: "Sink is clean", order: 0 },
          { text: "Countertop is clear", order: 1 },
          { text: "Mirror is clean", order: 2 },
          { text: "Trash removed", order: 3 },
          { text: "Floor appears clean", order: 4 },
        ],
      },
    },
  });

  console.log("Seeded:", {
    demo: ["sam", "ava", "leo"].map((u) => `${u} / ${DEMO_PASSWORD}`),
    test: ["andrew", "kelsi", "easton", "ashton"].map((u) => `${u} / password1234`),
    families: ["andrew → easton", "kelsi → ashton"],
    chores: ["Clean Bedroom", "Clean Bathroom"],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
