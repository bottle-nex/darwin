-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_customColumnId_fkey";

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_customColumnId_fkey" FOREIGN KEY ("customColumnId") REFERENCES "CustomColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
