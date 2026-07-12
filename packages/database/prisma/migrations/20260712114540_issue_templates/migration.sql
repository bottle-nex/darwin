-- CreateTable
CREATE TABLE "IssueTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueTemplate_projectId_idx" ON "IssueTemplate"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueTemplate_projectId_name_key" ON "IssueTemplate"("projectId", "name");

-- AddForeignKey
ALTER TABLE "IssueTemplate" ADD CONSTRAINT "IssueTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
