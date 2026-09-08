-- CreateEnum
CREATE TYPE "ExecutionMode" AS ENUM ('Autonomous', 'Manual');

-- CreateEnum
CREATE TYPE "TimeoutBehavior" AS ENUM ('Proceed', 'Deny');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AgentQuestionType" ADD VALUE 'ApproveToolUse';
ALTER TYPE "AgentQuestionType" ADD VALUE 'ApprovePullRequest';

-- AlterEnum
ALTER TYPE "IssueStatus" ADD VALUE 'AwaitingApproval';

-- AlterTable
ALTER TABLE "AgentQuestion" ADD COLUMN     "timeoutBehavior" "TimeoutBehavior" NOT NULL DEFAULT 'Proceed';

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "prBody" TEXT;

-- AlterTable
ALTER TABLE "IssueConfig" ADD COLUMN     "executionMode" "ExecutionMode";

-- AlterTable
ALTER TABLE "ProjectConfig" ADD COLUMN     "executionMode" "ExecutionMode" NOT NULL DEFAULT 'Autonomous';
