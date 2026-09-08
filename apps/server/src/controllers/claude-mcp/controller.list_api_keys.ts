import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";

import ResponseWriter from "../../services/service.response";

export default class ApiKeyListController {
    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const api_keys = await prisma.apiKey.findMany({
                where: { userId: user.id },
                select: {
                    id: true,
                    label: true,
                    prefix: true,
                    lastUsedAt: true,
                    revokedAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            });

            ResponseWriter.success(res, { api_keys }, "Api keys fetched successfully");
        } catch (err) {
            console.log("[claude-mcp:list_api_keys] error while listing api keys", err);
            ResponseWriter.system_error(res);
        }
    }
}
