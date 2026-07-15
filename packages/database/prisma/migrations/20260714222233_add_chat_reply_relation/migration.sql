-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "repliedToId" TEXT;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_repliedToId_fkey" FOREIGN KEY ("repliedToId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
