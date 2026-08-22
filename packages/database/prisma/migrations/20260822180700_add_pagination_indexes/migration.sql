CREATE INDEX "Issue_projectId_status_createdAt_id_idx" ON "Issue"("projectId", "status", "createdAt", "id");

CREATE INDEX "Issue_projectId_customColumnId_createdAt_id_idx" ON "Issue"("projectId", "customColumnId", "createdAt", "id");

CREATE INDEX "Chat_issueId_createdAt_id_idx" ON "Chat"("issueId", "createdAt", "id");

CREATE INDEX "ProjectChat_projectId_createdAt_id_idx" ON "ProjectChat"("projectId", "createdAt", "id");

CREATE INDEX "TeamChat_teamId_createdAt_id_idx" ON "TeamChat"("teamId", "createdAt", "id");
