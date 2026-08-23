-- CreateIndex
CREATE INDEX "Notification_member_feed_idx" ON "Notification"("userId", "createdAt", "id") WHERE "projectId" IS NULL;
