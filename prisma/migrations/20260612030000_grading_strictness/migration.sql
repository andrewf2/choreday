-- Add per-chore AI grading strictness (1=very lenient .. 5=very strict)
ALTER TABLE "Chore" ADD COLUMN "gradingStrictness" INTEGER NOT NULL DEFAULT 3;
