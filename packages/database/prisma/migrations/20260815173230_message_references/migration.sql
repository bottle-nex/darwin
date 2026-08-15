-- DropForeignKey
ALTER TABLE "ChatMention" DROP CONSTRAINT "ChatMention_chatId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMention" DROP CONSTRAINT "ChatMention_memberId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectChatMention" DROP CONSTRAINT "ProjectChatMention_memberId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectChatMention" DROP CONSTRAINT "ProjectChatMention_projectChatId_fkey";

-- DropTable
DROP TABLE "ChatMention";

-- DropTable
DROP TABLE "ProjectChatMention";

-- CreateTable
CREATE TABLE "MessageReference" (
    "id" TEXT NOT NULL,
    "chatId" TEXT,
    "projectChatId" TEXT,
    "memberId" TEXT,
    "issueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageReference_chatId_idx" ON "MessageReference"("chatId");

-- CreateIndex
CREATE INDEX "MessageReference_projectChatId_idx" ON "MessageReference"("projectChatId");

-- CreateIndex
CREATE INDEX "MessageReference_memberId_idx" ON "MessageReference"("memberId");

-- CreateIndex
CREATE INDEX "MessageReference_issueId_idx" ON "MessageReference"("issueId");

-- AddForeignKey
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_projectChatId_fkey" FOREIGN KEY ("projectChatId") REFERENCES "ProjectChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ProjectMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_one_source"
    CHECK (("chatId" IS NOT NULL)::int + ("projectChatId" IS NOT NULL)::int = 1);

-- AddCheckConstraint
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_one_target"
    CHECK (("memberId" IS NOT NULL)::int + ("issueId" IS NOT NULL)::int = 1);
