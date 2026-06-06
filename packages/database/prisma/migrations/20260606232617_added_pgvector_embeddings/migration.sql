-- DropIndex
DROP INDEX "code_embeddings_embedding_idx";

-- AlterTable
ALTER TABLE "code_embeddings" ALTER COLUMN "updatedAt" DROP DEFAULT;
