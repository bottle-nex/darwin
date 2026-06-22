-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('Booting', 'Idle', 'Busy', 'Dead');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "assignerWorkerId" TEXT,
ADD COLUMN     "queuePosition" INTEGER,
ADD COLUMN     "specialization" TEXT;

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "specialization" TEXT,
    "status" "WorkerStatus" NOT NULL,
    "sandboxId" TEXT,
    "contextSummary" JSONB,
    "contextBlobUrl" TEXT,
    "nextQueuePos" INTEGER NOT NULL DEFAULT 1,
    "leaseExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Worker_projectId_status_idx" ON "Worker"("projectId", "status");

-- CreateIndex
CREATE INDEX "Worker_projectId_specialization_idx" ON "Worker"("projectId", "specialization");

-- CreateIndex
CREATE INDEX "Issue_assignerWorkerId_status_queuePosition_idx" ON "Issue"("assignerWorkerId", "status", "queuePosition");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assignerWorkerId_fkey" FOREIGN KEY ("assignerWorkerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
