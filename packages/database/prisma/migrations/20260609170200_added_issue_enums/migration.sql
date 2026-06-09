/*
  Warnings:

  - You are about to drop the column `endLine` on the `code_embeddings` table. All the data in the column will be lost.
  - Added the required column `endLinTe` to the `code_embeddings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('Todo', 'Routed');

-- AlterTable
ALTER TABLE "code_embeddings" DROP COLUMN "endLine",
ADD COLUMN     "endLinTe" INTEGER NOT NULL;
