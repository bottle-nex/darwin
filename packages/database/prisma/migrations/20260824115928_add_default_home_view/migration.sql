-- CreateEnum
CREATE TYPE "DefaultHomeView" AS ENUM ('Inbox', 'Chats', 'Kanban', 'Gantt', 'Tags', 'AssignedToMe');

-- AlterTable
ALTER TABLE "UserConfig" ADD COLUMN     "defaultHomeView" "DefaultHomeView" NOT NULL DEFAULT 'Kanban';
