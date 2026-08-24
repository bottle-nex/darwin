import { Action, Permissions } from "@trymatcha/access-control";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import NotificationFeedService, {
    InvalidNotificationCursorError,
} from "../../services/service.notification-feed";
import ResponseWriter from "../../services/service.response";

export default class ListProjectNotificationsController {
    static params_schema = z.object({ project_id: z.string().min(1) });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const params = ListProjectNotificationsController.params_schema.safeParse(req.params);
        const query = NotificationFeedService.query_schema.safeParse(req.query);
        if (!params.success || !query.success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        const role = await Access.project(user.id, params.data.project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You dont have access to the project");
            return;
        }

        try {
            const page = await NotificationFeedService.list(
                { kind: "project", projectId: params.data.project_id, viewerId: user.id },
                query.data,
            );
            ResponseWriter.success(res, page, "Inbox fetched successfully");
        } catch (error) {
            if (error instanceof InvalidNotificationCursorError) {
                ResponseWriter.invalid_data(res, "Invalid cursor");
                return;
            }
            console.error("ListProjectNotificationsController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
