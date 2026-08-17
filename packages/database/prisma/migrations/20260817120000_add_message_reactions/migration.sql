CREATE TABLE "ChatReaction" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectChatReaction" (
    "id" TEXT NOT NULL,
    "projectChatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectChatReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatReaction_chatId_userId_emoji_key"
ON "ChatReaction"("chatId", "userId", "emoji");

CREATE INDEX "ChatReaction_chatId_idx" ON "ChatReaction"("chatId");
CREATE INDEX "ChatReaction_userId_idx" ON "ChatReaction"("userId");

CREATE UNIQUE INDEX "ProjectChatReaction_projectChatId_userId_emoji_key"
ON "ProjectChatReaction"("projectChatId", "userId", "emoji");

CREATE INDEX "ProjectChatReaction_projectChatId_idx" ON "ProjectChatReaction"("projectChatId");
CREATE INDEX "ProjectChatReaction_userId_idx" ON "ProjectChatReaction"("userId");

ALTER TABLE "ChatReaction"
ADD CONSTRAINT "ChatReaction_chatId_fkey"
FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatReaction"
ADD CONSTRAINT "ChatReaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectChatReaction"
ADD CONSTRAINT "ProjectChatReaction_projectChatId_fkey"
FOREIGN KEY ("projectChatId") REFERENCES "ProjectChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectChatReaction"
ADD CONSTRAINT "ProjectChatReaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "NotificationType" ADD VALUE 'MessageReacted';
