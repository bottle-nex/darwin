-- CreateEnum
CREATE TYPE "GithubImportTarget" AS ENUM ('AgentBoard', 'CustomColumn');

-- CreateTable
CREATE TABLE "GithubIssueImport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "target" "GithubImportTarget" NOT NULL DEFAULT 'AgentBoard',
    "customColumnId" TEXT,
    "tagId" TEXT,
    "configuredById" TEXT NOT NULL,
    "backfillAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GithubIssueImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubIssueLink" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "githubIssueId" BIGINT NOT NULL,
    "number" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "authorLogin" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubIssueLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GithubIssueImport_projectId_key" ON "GithubIssueImport"("projectId");

-- CreateIndex
CREATE INDEX "GithubIssueImport_customColumnId_idx" ON "GithubIssueImport"("customColumnId");

-- CreateIndex
CREATE INDEX "GithubIssueImport_tagId_idx" ON "GithubIssueImport"("tagId");

-- CreateIndex
CREATE INDEX "GithubIssueImport_configuredById_idx" ON "GithubIssueImport"("configuredById");

-- CreateIndex
CREATE UNIQUE INDEX "GithubIssueLink_issueId_key" ON "GithubIssueLink"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "GithubIssueLink_projectId_githubIssueId_key" ON "GithubIssueLink"("projectId", "githubIssueId");

-- AddForeignKey
ALTER TABLE "GithubIssueImport" ADD CONSTRAINT "GithubIssueImport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubIssueImport" ADD CONSTRAINT "GithubIssueImport_customColumnId_fkey" FOREIGN KEY ("customColumnId") REFERENCES "CustomColumn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubIssueImport" ADD CONSTRAINT "GithubIssueImport_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubIssueImport" ADD CONSTRAINT "GithubIssueImport_configuredById_fkey" FOREIGN KEY ("configuredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubIssueLink" ADD CONSTRAINT "GithubIssueLink_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
