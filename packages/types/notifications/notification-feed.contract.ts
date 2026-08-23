import type { CursorPage } from "../pagination/page.type";
import type { Notification } from "../prisma/schemas.prisma";

export type NotificationFeedPage = CursorPage<Notification> & {
    unreadCount?: number;
};
