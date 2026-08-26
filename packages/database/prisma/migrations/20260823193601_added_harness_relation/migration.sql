-- CreateEnum
CREATE TYPE "Harness" AS ENUM ('Claude', 'Codex', 'OpenCode');

-- CreateEnum
CREATE TYPE "Effort" AS ENUM ('Low', 'Medium', 'High', 'XHigh', 'Max');

-- AlterTable
ALTER TABLE "AgentSession" ADD COLUMN     "effort" "Effort",
ADD COLUMN     "harness" "Harness",
ADD COLUMN     "harnessVersion" TEXT,
ADD COLUMN     "model" TEXT;

-- AlterTable
ALTER TABLE "ProjectConfig" ADD COLUMN     "defaultEffort" "Effort",
ADD COLUMN     "defaultModel" TEXT,
ADD COLUMN     "harness" "Harness" NOT NULL DEFAULT 'Claude';

-- CreateTable
CREATE TABLE "IssueConfig" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "harness" "Harness" NOT NULL,
    "model" TEXT NOT NULL,
    "effort" "Effort",

    CONSTRAINT "IssueConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IssueConfig_issueId_key" ON "IssueConfig"("issueId");

-- AddForeignKey
ALTER TABLE "IssueConfig" ADD CONSTRAINT "IssueConfig_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
