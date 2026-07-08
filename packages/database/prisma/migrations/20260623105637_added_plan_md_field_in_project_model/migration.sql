-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('Pending', 'Generating', 'Ready', 'Failed');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "planMd" TEXT,
ADD COLUMN     "planStatus" "PlanStatus" NOT NULL DEFAULT 'Pending';
