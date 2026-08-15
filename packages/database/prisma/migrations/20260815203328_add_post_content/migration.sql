-- CreateEnum
CREATE TYPE "PostKind" AS ENUM ('Blog', 'Changelog');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('Draft', 'Published');

-- CreateEnum
CREATE TYPE "ReleaseChannel" AS ENUM ('Beta', 'Stable');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'IssueReferenced';

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "kind" "PostKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "plainText" TEXT NOT NULL,
    "coverImage" TEXT,
    "author" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "version" TEXT,
    "channel" "ReleaseChannel",
    "status" "PostStatus" NOT NULL DEFAULT 'Draft',
    "readingTime" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_kind_status_publishedAt_idx" ON "Post"("kind", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Post_kind_slug_key" ON "Post"("kind", "slug");
