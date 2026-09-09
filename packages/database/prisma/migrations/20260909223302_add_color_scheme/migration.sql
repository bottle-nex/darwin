-- CreateEnum
CREATE TYPE "ColorScheme" AS ENUM ('Dark', 'Light', 'System');

-- AlterTable
ALTER TABLE "UserConfig" ADD COLUMN     "colorScheme" "ColorScheme" NOT NULL DEFAULT 'Dark';
