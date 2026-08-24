import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";

import ResponseWriter from "../../services/service.response";

export default class GetLastVisitedController {
    static async process(req: Request, res: Response) {
        try {
            const userId = req.user.id;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    lastVisitedOrg: { select: { slug: true } },
                    lastVisitedProject: { select: { slug: true } },
                },
            });

            const lastVisited =
                user?.lastVisitedOrg && user?.lastVisitedProject
                    ? {
                          orgSlug: user.lastVisitedOrg.slug,
                          projectSlug: user.lastVisitedProject.slug,
                      }
                    : null;

            return ResponseWriter.success(res, lastVisited, "Last visited fetched");
        } catch (error) {
            console.error("error in get last visited controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
