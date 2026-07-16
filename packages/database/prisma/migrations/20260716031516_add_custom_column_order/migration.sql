-- CreateTable
CREATE TABLE "CustomColumnOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomColumnOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomColumnOrder_userId_projectId_idx" ON "CustomColumnOrder"("userId", "projectId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "CustomColumnOrder_userId_columnId_key" ON "CustomColumnOrder"("userId", "columnId");

-- AddForeignKey
ALTER TABLE "CustomColumnOrder" ADD CONSTRAINT "CustomColumnOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomColumnOrder" ADD CONSTRAINT "CustomColumnOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomColumnOrder" ADD CONSTRAINT "CustomColumnOrder_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "CustomColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
