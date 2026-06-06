CREATE EXTENSION IF NOT EXISTS vector;

  CREATE TABLE "code_embeddings" (
      "id"        TEXT         NOT NULL,
      "projectId" TEXT         NOT NULL,
      "filePath"  TEXT         NOT NULL,
      "chunkText" TEXT         NOT NULL,
      "chunkType" TEXT         NOT NULL,
      "startLine" INTEGER      NOT NULL,
      "endLine"   INTEGER      NOT NULL,
      "embedding" vector(1536) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "code_embeddings_pkey" PRIMARY KEY ("id")
  );

  ALTER TABLE "code_embeddings"
      ADD CONSTRAINT "code_embeddings_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "Project"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;

  CREATE INDEX "code_embeddings_projectId_idx" ON "code_embeddings"("projectId");

  CREATE INDEX "code_embeddings_embedding_idx"
      ON "code_embeddings" USING hnsw ("embedding" vector_cosine_ops);
