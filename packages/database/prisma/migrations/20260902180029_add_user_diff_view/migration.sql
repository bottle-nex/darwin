-- CreateEnum
CREATE TYPE "DiffView" AS ENUM ('Unified', 'Split');

-- AlterTable
ALTER TABLE "UserConfig" ADD COLUMN     "diffView" "DiffView" NOT NULL DEFAULT 'Unified';
