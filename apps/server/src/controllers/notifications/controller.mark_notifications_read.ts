import { Request, Response } from "express";
import z from "zod";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";

export default class MarkNotificationsReadController {
    static body_schema = z.object({
        ids: z.array(z.string().min(1)).min(1).max(100).optional(),
    });

    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: body_data, success } = MarkNotificationsReadController.body_schema.safeParse(
            req.body ?? {},
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const result = await prisma.notification.updateMany({
                where: {
                    userId: user.id,
                    readAt: null,
                    ...(body_data.ids ? { id: { in: body_data.ids } } : {}),
                },
                data: { readAt: new Date() },
            });

            const unreadCount = await prisma.notification.count({
                where: { userId: user.id, readAt: null },
            });

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
