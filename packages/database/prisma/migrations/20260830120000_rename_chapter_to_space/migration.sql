ALTER TABLE "Chapter" RENAME TO "Space";
ALTER TABLE "CustomColumn" RENAME COLUMN "chapterId" TO "spaceId";
ALTER TABLE "CustomColumnOrder" RENAME COLUMN "chapterId" TO "spaceId";

ALTER INDEX "Chapter_pkey" RENAME TO "Space_pkey";
ALTER INDEX "Chapter_projectId_idx" RENAME TO "Space_projectId_idx";
ALTER INDEX "Chapter_projectId_slug_key" RENAME TO "Space_projectId_slug_key";
ALTER INDEX "CustomColumn_chapterId_idx" RENAME TO "CustomColumn_spaceId_idx";
ALTER INDEX "CustomColumnOrder_userId_chapterId_idx" RENAME TO "CustomColumnOrder_userId_spaceId_idx";

ALTER TABLE "Space" RENAME CONSTRAINT "Chapter_projectId_fkey" TO "Space_projectId_fkey";
ALTER TABLE "CustomColumn" RENAME CONSTRAINT "CustomColumn_chapterId_fkey" TO "CustomColumn_spaceId_fkey";
ALTER TABLE "CustomColumnOrder" RENAME CONSTRAINT "CustomColumnOrder_chapterId_fkey" TO "CustomColumnOrder_spaceId_fkey";

ALTER TABLE "Space" ADD COLUMN "description" TEXT;
