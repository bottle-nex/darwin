/*
  Warnings:

  - You are about to drop the column `description` on the `IssueTemplate` table. All the data in the column will be lost.
  - Added the required column `fields` to the `IssueTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IssueTemplate" DROP COLUMN "description",
ADD COLUMN     "fields" JSONB NOT NULL,
ADD COLUMN     "summary" TEXT;
