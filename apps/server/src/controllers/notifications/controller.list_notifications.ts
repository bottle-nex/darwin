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
            const notifications = await prisma.notification.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                take: 50,
            });

            ResponseWriter.success(res, { notifications }, "Notifications fetched successfully");
        } catch (error) {
            console.error("ListNotificationsController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
