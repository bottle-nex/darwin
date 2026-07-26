-- CreateTable
CREATE TABLE "ChatMention" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectChatMention" (
    "id" TEXT NOT NULL,
    "projectChatId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectChatMention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMention_memberId_idx" ON "ChatMention"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMention_chatId_memberId_key" ON "ChatMention"("chatId", "memberId");

-- CreateIndex
CREATE INDEX "ProjectChatMention_memberId_idx" ON "ProjectChatMention"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectChatMention_projectChatId_memberId_key" ON "ProjectChatMention"("projectChatId", "memberId");

-- AddForeignKey
ALTER TABLE "ChatMention" ADD CONSTRAINT "ChatMention_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMention" ADD CONSTRAINT "ChatMention_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ProjectMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectChatMention" ADD CONSTRAINT "ProjectChatMention_projectChatId_fkey" FOREIGN KEY ("projectChatId") REFERENCES "ProjectChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectChatMention" ADD CONSTRAINT "ProjectChatMention_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ProjectMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
