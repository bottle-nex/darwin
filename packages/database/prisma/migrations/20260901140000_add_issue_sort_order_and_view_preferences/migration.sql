-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "sortOrder" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Every list was ordered newest-first by "createdAt", so seeding the new key from it
-- keeps each board and list in exactly the order it already had.
UPDATE "Issue" SET "sortOrder" = EXTRACT(EPOCH FROM "createdAt");

-- CreateTable
CREATE TABLE "IssueViewPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "viewKey" TEXT NOT NULL,
    "layout" TEXT NOT NULL,
    "groupBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueViewPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueViewPreference_userId_projectId_idx" ON "IssueViewPreference"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueViewPreference_userId_projectId_viewKey_key" ON "IssueViewPreference"("userId", "projectId", "viewKey");

-- AddForeignKey
ALTER TABLE "IssueViewPreference" ADD CONSTRAINT "IssueViewPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueViewPreference" ADD CONSTRAINT "IssueViewPreference_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "Issue_projectId_status_createdAt_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "Issue_projectId_customColumnId_createdAt_id_idx";

-- CreateIndex
CREATE INDEX "Issue_projectId_status_sortOrder_id_idx" ON "Issue"("projectId", "status", "sortOrder", "id");

-- CreateIndex
CREATE INDEX "Issue_projectId_customColumnId_sortOrder_id_idx" ON "Issue"("projectId", "customColumnId", "sortOrder", "id");
