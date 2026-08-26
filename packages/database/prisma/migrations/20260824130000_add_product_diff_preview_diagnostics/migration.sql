ALTER TYPE "ProductDiffStatus" ADD VALUE 'ConfigurationRequired';
ALTER TYPE "ProductDiffStatus" ADD VALUE 'PreviewUnavailable';

ALTER TABLE "ProductDiff" ADD COLUMN "diagnostics" JSONB;

ALTER TABLE "ProjectConfig" ADD COLUMN "productDiffPreviewConfig" JSONB;
