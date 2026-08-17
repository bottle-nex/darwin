-- CreateEnum
CREATE TYPE "ProductDiffStatus" AS ENUM ('Pending', 'Generating', 'Ready', 'Failed', 'Stale');

ALTER TABLE "Issue" ADD COLUMN "prBranch" TEXT;

-- AlterTable
ALTER TABLE "ProjectConfig" ADD COLUMN "productDiffEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProductDiff" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "pullNumber" INTEGER NOT NULL,
    "baseSha" TEXT NOT NULL,
    "headSha" TEXT NOT NULL,
    "status" "ProductDiffStatus" NOT NULL DEFAULT 'Pending',
    "manifest" JSONB,
    "artifactPrefix" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDiff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductDiff_issueId_baseSha_headSha_key" ON "ProductDiff"("issueId", "baseSha", "headSha");

-- CreateIndex
CREATE INDEX "ProductDiff_status_createdAt_idx" ON "ProductDiff"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductDiff" ADD CONSTRAINT "ProductDiff_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
