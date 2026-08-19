import type { Request, Response } from "express";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";

export default class GetSidebarThemeController {
    static async process(req: Request, res: Response) {
        try {
            const userId = req.user.id;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { sidebarTheme: true },
            });

            if (!user) {
                return ResponseWriter.not_found(res, "User not found");
            }

            return ResponseWriter.success(
                res,
                { sidebarTheme: user.sidebarTheme },
                "Sidebar theme fetched",
            );
        } catch (error) {
            console.error("error in get sidebar theme controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
