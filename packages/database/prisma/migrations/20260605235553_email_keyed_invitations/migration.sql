-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_userId_fkey";

-- DropIndex
DROP INDEX "Invitation_userId_orgId_teamId_key";

-- DropIndex
DROP INDEX "Invitation_userId_status_idx";

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Invitation_email_status_idx" ON "Invitation"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_orgId_teamId_key" ON "Invitation"("email", "orgId", "teamId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

