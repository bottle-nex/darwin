import type { Request, Response } from "express";

import NotificationFeedService, {
    InvalidNotificationCursorError,
} from "../../services/service.notification-feed";
import ResponseWriter from "../../services/service.response";

export default class ListMemberNotificationsController {
    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const query = NotificationFeedService.query_schema.safeParse(req.query);
        if (!query.success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const page = await NotificationFeedService.list(
                { kind: "member", viewerId: user.id },
                query.data,
            );
            ResponseWriter.success(res, page, "Notifications fetched successfully");
        } catch (error) {
            if (error instanceof InvalidNotificationCursorError) {
                ResponseWriter.invalid_data(res, "Invalid cursor");
                return;
            }
            console.error("ListMemberNotificationsController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
