ALTER TYPE "NotificationType" ADD VALUE 'TeamChatMention';

CREATE TABLE "TeamChat" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "senderId" TEXT,
    "message" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "repliedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamChat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamChatReaction" (
    "id" TEXT NOT NULL,
    "teamChatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamChatReaction_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MessageReference" ADD COLUMN "teamChatId" TEXT;

CREATE INDEX "TeamChat_teamId_idx" ON "TeamChat"("teamId");
CREATE UNIQUE INDEX "TeamChatReaction_teamChatId_userId_key" ON "TeamChatReaction"("teamChatId", "userId");
CREATE INDEX "TeamChatReaction_teamChatId_idx" ON "TeamChatReaction"("teamChatId");
CREATE INDEX "TeamChatReaction_userId_idx" ON "TeamChatReaction"("userId");
CREATE INDEX "MessageReference_teamChatId_idx" ON "MessageReference"("teamChatId");

ALTER TABLE "TeamChat" ADD CONSTRAINT "TeamChat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamChat" ADD CONSTRAINT "TeamChat_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeamChat" ADD CONSTRAINT "TeamChat_repliedToId_fkey" FOREIGN KEY ("repliedToId") REFERENCES "TeamChat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeamChatReaction" ADD CONSTRAINT "TeamChatReaction_teamChatId_fkey" FOREIGN KEY ("teamChatId") REFERENCES "TeamChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamChatReaction" ADD CONSTRAINT "TeamChatReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_teamChatId_fkey" FOREIGN KEY ("teamChatId") REFERENCES "TeamChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReference" DROP CONSTRAINT "MessageReference_one_source";
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_one_source"
    CHECK (("chatId" IS NOT NULL)::int + ("projectChatId" IS NOT NULL)::int + ("teamChatId" IS NOT NULL)::int = 1);
