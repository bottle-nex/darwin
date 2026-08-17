DELETE FROM "ChatReaction" a
USING "ChatReaction" b
WHERE a."chatId" = b."chatId"
  AND a."userId" = b."userId"
  AND (a."createdAt", a."id") < (b."createdAt", b."id");

DELETE FROM "ProjectChatReaction" a
USING "ProjectChatReaction" b
WHERE a."projectChatId" = b."projectChatId"
  AND a."userId" = b."userId"
  AND (a."createdAt", a."id") < (b."createdAt", b."id");

DROP INDEX "ChatReaction_chatId_userId_emoji_key";
DROP INDEX "ProjectChatReaction_projectChatId_userId_emoji_key";

CREATE UNIQUE INDEX "ChatReaction_chatId_userId_key"
ON "ChatReaction"("chatId", "userId");

CREATE UNIQUE INDEX "ProjectChatReaction_projectChatId_userId_key"
ON "ProjectChatReaction"("projectChatId", "userId");
