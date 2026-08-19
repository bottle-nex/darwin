-- CreateEnum
CREATE TYPE "SidebarTheme" AS ENUM ('TimeOfDay', 'Matcha', 'Lilac', 'Ember', 'Slate', 'Neutral');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sidebarTheme" "SidebarTheme" NOT NULL DEFAULT 'TimeOfDay';
