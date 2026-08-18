-- CreateEnum
CREATE TYPE "AgentSessionStatus" AS ENUM ('Running', 'Succeeded', 'Failed', 'Aborted');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('User', 'Agent', 'System', 'Github');

-- CreateEnum
CREATE TYPE "ActivitySurface" AS ENUM ('Primary', 'Secondary', 'Audit');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('IssueCreated', 'IssueReopened', 'IssueResolved', 'IssueCancelled', 'IssueArchived', 'IssueDeleted', 'StatusChanged', 'PriorityChanged', 'TitleChanged', 'DescriptionChanged', 'SummaryChanged', 'AssigneeAdded', 'AssigneeRemoved', 'LabelAdded', 'LabelRemoved', 'DatesChanged', 'ColumnChanged', 'SpecializationChanged', 'RelationAdded', 'RelationRemoved', 'SplitIntoSubIssues', 'Queued', 'Routed', 'Reprioritized', 'Preempted', 'Starved', 'RunStarted', 'RunCompleted', 'AttemptFailed', 'RunAborted', 'WorkerHandoff', 'WorkerDied', 'HumanTookOver', 'HandedBackToHuman', 'BugReproduced', 'BugNotReproduced', 'BuildResult', 'TestResult', 'AcceptanceChecked', 'BranchCreated', 'CommitsPushed', 'PrOpened', 'PrReviewReceived', 'PrFeedbackAddressed', 'PrChecksFailed', 'PrRebased', 'PrMerged', 'PrClosed', 'PrReverted', 'ExternalMessageSent', 'ExternalIssueOpened', 'ExternalDocUpdated', 'OncallPaged', 'ScopeRequested', 'ScopeGranted', 'ScopeDenied', 'GuardrailHit', 'SecretAccessed', 'BudgetThresholdCrossed', 'BudgetExceeded', 'AttachmentAdded');

-- CreateTable
CREATE TABLE "IssueActivity" (
    "id" TEXT NOT NULL,
    "seq" BIGSERIAL NOT NULL,
    "issueId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "payload" JSONB,
    "actorType" "ActorType" NOT NULL,
    "actorUserId" TEXT,
    "actorWorkerId" TEXT,
    "surface" "ActivitySurface" NOT NULL DEFAULT 'Primary',
    "sessionId" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "workerId" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" "AgentSessionStatus" NOT NULL DEFAULT 'Running',
    "summary" TEXT,
    "stats" JSONB,
    "cost" JSONB,
    "traceUrl" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueActivity_issueId_seq_idx" ON "IssueActivity"("issueId", "seq");

-- CreateIndex
CREATE INDEX "IssueActivity_sessionId_idx" ON "IssueActivity"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueActivity_issueId_dedupeKey_key" ON "IssueActivity"("issueId", "dedupeKey");

-- CreateIndex
CREATE INDEX "AgentSession_issueId_startedAt_idx" ON "AgentSession"("issueId", "startedAt");

-- CreateIndex
CREATE INDEX "AgentSession_workerId_status_idx" ON "AgentSession"("workerId", "status");

-- AddForeignKey
ALTER TABLE "IssueActivity" ADD CONSTRAINT "IssueActivity_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueActivity" ADD CONSTRAINT "IssueActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueActivity" ADD CONSTRAINT "IssueActivity_actorWorkerId_fkey" FOREIGN KEY ("actorWorkerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueActivity" ADD CONSTRAINT "IssueActivity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AgentSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill the "created" row every pre-existing issue is missing, sourced from
-- the columns that already record it. Without this an issue filed before the
-- feed existed opens to an empty timeline. The `issue:created` dedupe key is the
-- same one the create controller writes, so the unique index keeps it to one row
-- per issue no matter how often this is replayed.
INSERT INTO "IssueActivity" (
    "id", "issueId", "type", "payload", "actorType", "actorUserId", "surface", "dedupeKey", "createdAt"
)
SELECT
    gen_random_uuid()::text,
    i."id",
    'IssueCreated',
    jsonb_build_object('actor', jsonb_build_object('name', u."name", 'image', u."image")),
    'User',
    i."createdById",
    'Primary',
    'issue:created',
    i."createdAt"
FROM "Issue" i
LEFT JOIN "User" u ON u."id" = i."createdById"
ORDER BY i."createdAt";
