-- Optional parent note left when approving/rejecting a submission
ALTER TABLE "Submission" ADD COLUMN "parentComment" TEXT;
