-- CreateTable
CREATE TABLE "DescriptionReference" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "memberId" TEXT,
    "referencedIssueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DescriptionReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DescriptionReference_issueId_idx" ON "DescriptionReference"("issueId");

-- CreateIndex
CREATE INDEX "DescriptionReference_memberId_idx" ON "DescriptionReference"("memberId");

-- CreateIndex
CREATE INDEX "DescriptionReference_referencedIssueId_idx" ON "DescriptionReference"("referencedIssueId");

-- AddForeignKey
ALTER TABLE "DescriptionReference" ADD CONSTRAINT "DescriptionReference_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescriptionReference" ADD CONSTRAINT "DescriptionReference_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ProjectMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescriptionReference" ADD CONSTRAINT "DescriptionReference_referencedIssueId_fkey" FOREIGN KEY ("referencedIssueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
