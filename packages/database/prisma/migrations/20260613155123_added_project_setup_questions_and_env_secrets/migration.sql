-- CreateEnum
CREATE TYPE "SetupStatus" AS ENUM ('Pending', 'Provisioning', 'Cloning', 'Detecting', 'InstallingDeps', 'BootingServices', 'WaitingOnUser', 'Verifying', 'Ready', 'Failed');

-- CreateEnum
CREATE TYPE "SetupQuestionType" AS ENUM ('NeedSecret', 'NeedValue', 'NeedChoice', 'Confirm', 'NeedFile', 'NeedAccess', 'DefineSuccess', 'Clarify', 'ApproveCost');

-- CreateEnum
CREATE TYPE "SetupQuestionStatus" AS ENUM ('Waiting', 'Answered', 'Cancelled');

-- CreateTable
CREATE TABLE "SetupSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "SetupStatus" NOT NULL DEFAULT 'Pending',
    "sandboxId" TEXT,
    "snapshotId" TEXT,
    "infrastructureMd" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SetupSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "SetupQuestionType" NOT NULL,
    "key" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "status" "SetupQuestionStatus" NOT NULL DEFAULT 'Waiting',
    "answerValue" TEXT,
    "secretId" TEXT,
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "SetupQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSecret" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SetupSession_projectId_idx" ON "SetupSession"("projectId");

-- CreateIndex
CREATE INDEX "SetupQuestion_sessionId_status_idx" ON "SetupQuestion"("sessionId", "status");

-- CreateIndex
CREATE INDEX "ProjectSecret_projectId_idx" ON "ProjectSecret"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSecret_projectId_key_key" ON "ProjectSecret"("projectId", "key");

-- AddForeignKey
ALTER TABLE "SetupSession" ADD CONSTRAINT "SetupSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupQuestion" ADD CONSTRAINT "SetupQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SetupSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupQuestion" ADD CONSTRAINT "SetupQuestion_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "ProjectSecret"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSecret" ADD CONSTRAINT "ProjectSecret_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
