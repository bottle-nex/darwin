-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'DescriptionMention';

-- AlterTable
ALTER TABLE "DescriptionReference" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "MessageReference" ADD COLUMN     "teamId" TEXT;

-- CreateIndex
CREATE INDEX "DescriptionReference_teamId_idx" ON "DescriptionReference"("teamId");

-- CreateIndex
CREATE INDEX "MessageReference_teamId_idx" ON "MessageReference"("teamId");

-- AddForeignKey
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescriptionReference" ADD CONSTRAINT "DescriptionReference_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MessageReference" DROP CONSTRAINT "MessageReference_one_target";
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_one_target"
    CHECK (("memberId" IS NOT NULL)::int + ("issueId" IS NOT NULL)::int + ("teamId" IS NOT NULL)::int = 1);
