-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Chunk" AS ENUM ('Imports', 'Function', 'Class', 'Interface', 'Type', 'Variable', 'Block');

-- CreateTable
CREATE TABLE "code_embeddings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "chunkType" "Chunk" NOT NULL,
    "startLine" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "code_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "code_embeddings_projectId_idx" ON "code_embeddings"("projectId");

-- AddForeignKey
ALTER TABLE "code_embeddings" ADD CONSTRAINT "code_embeddings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
