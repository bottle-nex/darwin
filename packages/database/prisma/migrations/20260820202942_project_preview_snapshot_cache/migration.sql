-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "previewDepsHash" TEXT,
ADD COLUMN     "previewSnapshotAt" TIMESTAMP(3),
ADD COLUMN     "previewSnapshotId" TEXT;
