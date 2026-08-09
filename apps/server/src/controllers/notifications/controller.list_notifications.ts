import { Request, Response } from "express";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";

export default class ListNotificationsController {
    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        try {
            const [notifications, unreadCount] = await Promise.all([
                prisma.notification.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: "desc" },
                    take: 50,
                }),
                prisma.notification.count({
                    where: { userId: user.id, readAt: null },
                }),
            ]);

            ResponseWriter.success(
                res,
                { notifications, unreadCount },
                "Notifications fetched successfully",
            );
        } catch (error) {
            console.error("ListNotificationsController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
