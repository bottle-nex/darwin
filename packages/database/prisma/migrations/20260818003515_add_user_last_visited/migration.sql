-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastVisitedOrgId" TEXT,
ADD COLUMN     "lastVisitedProjectId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lastVisitedOrgId_fkey" FOREIGN KEY ("lastVisitedOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lastVisitedProjectId_fkey" FOREIGN KEY ("lastVisitedProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
