-- CreateEnum
CREATE TYPE "DarwinRole" AS ENUM ('System', 'User', 'Assistant', 'Tool');

-- CreateEnum
CREATE TYPE "DarwinToolStatus" AS ENUM ('Pending', 'Ok', 'Error');

-- CreateEnum
CREATE TYPE "DarwinRunStatus" AS ENUM ('Streaming', 'Done', 'Cancelled', 'Error');

-- CreateTable
CREATE TABLE "DarwinThread" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DarwinThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DarwinMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "runId" TEXT,
    "seq" INTEGER NOT NULL,
    "role" "DarwinRole" NOT NULL,
    "content" TEXT,
    "toolCalls" JSONB,
    "toolCallId" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DarwinMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DarwinToolCall" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "arguments" JSONB NOT NULL,
    "result" JSONB,
    "status" "DarwinToolStatus" NOT NULL DEFAULT 'Pending',
    "error" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DarwinToolCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DarwinRun" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "status" "DarwinRunStatus" NOT NULL DEFAULT 'Streaming',
    "model" TEXT NOT NULL,
    "iterations" INTEGER NOT NULL DEFAULT 0,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DarwinRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DarwinThread_projectId_userId_updatedAt_idx" ON "DarwinThread"("projectId", "userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "DarwinMessage_threadId_seq_idx" ON "DarwinMessage"("threadId", "seq");

-- CreateIndex
CREATE INDEX "DarwinMessage_runId_idx" ON "DarwinMessage"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "DarwinMessage_threadId_seq_key" ON "DarwinMessage"("threadId", "seq");

-- CreateIndex
CREATE INDEX "DarwinToolCall_threadId_createdAt_idx" ON "DarwinToolCall"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "DarwinToolCall_name_createdAt_idx" ON "DarwinToolCall"("name", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DarwinToolCall_messageId_callId_key" ON "DarwinToolCall"("messageId", "callId");

-- CreateIndex
CREATE INDEX "DarwinRun_threadId_createdAt_idx" ON "DarwinRun"("threadId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "DarwinRun_status_createdAt_idx" ON "DarwinRun"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "DarwinThread" ADD CONSTRAINT "DarwinThread_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DarwinThread" ADD CONSTRAINT "DarwinThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DarwinMessage" ADD CONSTRAINT "DarwinMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DarwinThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DarwinMessage" ADD CONSTRAINT "DarwinMessage_runId_fkey" FOREIGN KEY ("runId") REFERENCES "DarwinRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DarwinToolCall" ADD CONSTRAINT "DarwinToolCall_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "DarwinMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DarwinRun" ADD CONSTRAINT "DarwinRun_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "DarwinThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
