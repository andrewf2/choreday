-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amountCents" INTEGER NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "childId" TEXT NOT NULL,
    CONSTRAINT "Payout_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "definitionOfDone" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "allowanceCents" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedChildId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Chore_assignedChildId_fkey" FOREIGN KEY ("assignedChildId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Chore_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Chore" ("assignedChildId", "createdAt", "createdById", "definitionOfDone", "description", "dueDate", "id", "name", "status") SELECT "assignedChildId", "createdAt", "createdById", "definitionOfDone", "description", "dueDate", "id", "name", "status" FROM "Chore";
DROP TABLE "Chore";
ALTER TABLE "new_Chore" RENAME TO "Chore";
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "aiScore" INTEGER,
    "aiOverallStatus" TEXT,
    "parentOverridden" BOOLEAN NOT NULL DEFAULT false,
    "aiError" TEXT,
    "allowanceEarnedCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "choreId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    CONSTRAINT "Submission_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Submission" ("aiError", "aiOverallStatus", "aiScore", "childId", "choreId", "createdAt", "id", "note", "parentOverridden", "status") SELECT "aiError", "aiOverallStatus", "aiScore", "childId", "choreId", "createdAt", "id", "note", "parentOverridden", "status" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allowanceBalanceCents" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "id", "name", "parentId", "passwordHash", "role", "username") SELECT "createdAt", "id", "name", "parentId", "passwordHash", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
