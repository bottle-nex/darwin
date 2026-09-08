-- CreateEnum
CREATE TYPE "SwipeTarget" AS ENUM ('Settings', 'Darwin', 'Off');

-- AlterTable
ALTER TABLE "UserConfig" ADD COLUMN     "swipeTarget" "SwipeTarget" NOT NULL DEFAULT 'Settings';
