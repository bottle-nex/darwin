-- Chapters take ownership of custom columns. Existing columns are dropped, so
-- their parked issues are detached first: `Issue.customColumn` cascades on
-- delete, and `Parked` is not a board status, so both writes are required for
-- the issues to survive and land back on the agent board.
UPDATE "Issue" SET "customColumnId" = NULL, "status" = 'Todo' WHERE "customColumnId" IS NOT NULL;
DELETE FROM "CustomColumnOrder";
DELETE FROM "CustomColumn";

-- DropForeignKey
ALTER TABLE "CustomColumn" DROP CONSTRAINT "CustomColumn_projectId_fkey";

-- DropForeignKey
ALTER TABLE "CustomColumnOrder" DROP CONSTRAINT "CustomColumnOrder_projectId_fkey";

-- DropIndex
DROP INDEX "CustomColumn_projectId_idx";

-- DropIndex
DROP INDEX "CustomColumnOrder_userId_projectId_idx";

-- AlterTable
ALTER TABLE "CustomColumn" DROP COLUMN "projectId",
ADD COLUMN     "chapterId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CustomColumnOrder" DROP COLUMN "projectId",
ADD COLUMN     "chapterId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chapter_projectId_idx" ON "Chapter"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_projectId_slug_key" ON "Chapter"("projectId", "slug");

-- CreateIndex
CREATE INDEX "CustomColumn_chapterId_idx" ON "CustomColumn"("chapterId");

-- CreateIndex
CREATE INDEX "CustomColumnOrder_userId_chapterId_idx" ON "CustomColumnOrder"("userId", "chapterId");

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomColumn" ADD CONSTRAINT "CustomColumn_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomColumnOrder" ADD CONSTRAINT "CustomColumnOrder_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
