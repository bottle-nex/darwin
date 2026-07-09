-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "targetDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "_IssueToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IssueToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_IssueToTag_B_index" ON "_IssueToTag"("B");

-- AddForeignKey
ALTER TABLE "_IssueToTag" ADD CONSTRAINT "_IssueToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueToTag" ADD CONSTRAINT "_IssueToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
