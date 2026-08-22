-- CreateExtension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Issue_title_trgm_idx" ON "Issue" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Issue_description_trgm_idx" ON "Issue" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Chat_message_trgm_idx" ON "Chat" USING GIN ("message" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "ProjectChat_message_trgm_idx" ON "ProjectChat" USING GIN ("message" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "TeamChat_message_trgm_idx" ON "TeamChat" USING GIN ("message" gin_trgm_ops);
