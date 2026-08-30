-- AlterTable
ALTER TABLE "GithubIssueImport" ALTER COLUMN "target" DROP NOT NULL,
ALTER COLUMN "target" DROP DEFAULT;
