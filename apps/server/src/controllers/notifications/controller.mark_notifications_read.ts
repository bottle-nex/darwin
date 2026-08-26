import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";

import NotificationFeedService, {
    type NotificationFeedScope,
} from "../../services/service.notification-feed";
import ResponseWriter from "../../services/service.response";
import {
    notification_read_body_schema,
    type NotificationReadBody,
} from "./notification-read.schema";

function feed_scope(body: NotificationReadBody, viewer_id: string): NotificationFeedScope {
    return body.scope === "project"
        ? { kind: "project", projectId: body.projectId, viewerId: viewer_id }
        : { kind: "member", viewerId: viewer_id };
}

export default class MarkNotificationsReadController {
    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const body = notification_read_body_schema.safeParse(req.body ?? {});
        if (!body.success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const scope = feed_scope(body.data, user.id);

        try {
            const result = await prisma.notification.updateMany({
                where: body.data.ids
                    ? { userId: user.id, readAt: null, id: { in: body.data.ids } }
                    : { ...NotificationFeedService.scope_filter(scope), readAt: null },
                data: { readAt: new Date() },
            });

            const unreadCount = await NotificationFeedService.unread_count(scope);

            ResponseWriter.success(
                res,
                { updated: result.count, unreadCount },
                "Notifications marked read",
            );
        } catch (error) {
            console.error("MarkNotificationsReadController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
