-- Statuses that only existed while previews booted the project's dev server.
-- Rows sitting in them are closed out before the values disappear.
UPDATE "ProductDiff" SET "status" = 'Failed'
WHERE "status" IN ('ConfigurationRequired', 'PreviewUnavailable');

-- Manifests written by the screenshot and replay pipelines cannot be read by the
-- capsule viewer, so the reviewer is offered a regenerate instead of a broken page.
UPDATE "ProductDiff" SET "status" = 'Stale'
WHERE "status" = 'Ready';

-- AlterEnum
BEGIN;
CREATE TYPE "ProductDiffStatus_new" AS ENUM ('Pending', 'Generating', 'Ready', 'Failed', 'Stale', 'Unsupported');
ALTER TABLE "public"."ProductDiff" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ProductDiff" ALTER COLUMN "status" TYPE "ProductDiffStatus_new" USING ("status"::text::"ProductDiffStatus_new");
ALTER TYPE "ProductDiffStatus" RENAME TO "ProductDiffStatus_old";
ALTER TYPE "ProductDiffStatus_new" RENAME TO "ProductDiffStatus";
DROP TYPE "public"."ProductDiffStatus_old";
ALTER TABLE "ProductDiff" ALTER COLUMN "status" SET DEFAULT 'Pending';
COMMIT;

-- AlterTable
ALTER TABLE "ProductDiff" DROP COLUMN "diagnostics";

-- AlterTable
ALTER TABLE "ProjectConfig" DROP COLUMN "productDiffPreviewConfig";
