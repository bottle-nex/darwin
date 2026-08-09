-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'IssueStatusChanged';
ALTER TYPE "NotificationType" ADD VALUE 'IssuePriorityChanged';
ALTER TYPE "NotificationType" ADD VALUE 'IssueMoved';
ALTER TYPE "NotificationType" ADD VALUE 'IssueCommented';
ALTER TYPE "NotificationType" ADD VALUE 'IssueDeleted';
ALTER TYPE "NotificationType" ADD VALUE 'InviteAccepted';
ALTER TYPE "NotificationType" ADD VALUE 'AddedToProject';
ALTER TYPE "NotificationType" ADD VALUE 'AddedToTeam';
ALTER TYPE "NotificationType" ADD VALUE 'RemovedFromTeam';
ALTER TYPE "NotificationType" ADD VALUE 'RemovedFromOrg';
ALTER TYPE "NotificationType" ADD VALUE 'RoleChanged';
