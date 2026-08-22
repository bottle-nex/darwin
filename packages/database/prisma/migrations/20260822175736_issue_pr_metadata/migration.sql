-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "prNumber" INTEGER,
ADD COLUMN     "prTitle" TEXT;

-- Backfill: the pull number is already inside prUrl, so no GitHub call is needed.
-- prTitle stays null and is filled in on the first load of that PR's review page.
UPDATE "Issue"
SET "prNumber" = (regexp_match("prUrl", '/pull/(\d+)'))[1]::int
WHERE "prUrl" IS NOT NULL AND "prNumber" IS NULL;
