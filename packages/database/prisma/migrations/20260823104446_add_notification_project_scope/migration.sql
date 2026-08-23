-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "projectId" TEXT;

UPDATE "Notification" AS "n"
SET "projectId" = "p"."id"
FROM "Project" AS "p"
WHERE "p"."id" = "n"."payload"->>'projectId'
  AND "n"."type" IN (
    'IssueAssigned',
    'IssueUnassigned',
    'IssueStatusChanged',
    'IssuePriorityChanged',
    'IssueMoved',
    'IssueCommented',
    'IssueReferenced',
    'IssueDeleted',
    'ChatMention',
    'ProjectChatMention',
    'TeamChatMention',
    'MessageReacted'
  );

-- CreateIndex
CREATE INDEX "Notification_userId_projectId_createdAt_id_idx" ON "Notification"("userId", "projectId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Notification_userId_projectId_readAt_idx" ON "Notification"("userId", "projectId", "readAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
