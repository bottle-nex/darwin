-- CreateTable
CREATE TABLE "ProjectChat" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "senderId" TEXT,
    "message" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "repliedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectChat_projectId_idx" ON "ProjectChat"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectChat" ADD CONSTRAINT "ProjectChat_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectChat" ADD CONSTRAINT "ProjectChat_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectChat" ADD CONSTRAINT "ProjectChat_repliedToId_fkey" FOREIGN KEY ("repliedToId") REFERENCES "ProjectChat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
