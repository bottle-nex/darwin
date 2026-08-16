-- DropIndex
DROP INDEX "Post_kind_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");
