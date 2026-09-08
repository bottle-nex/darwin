import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import z from "zod";

import ResponseWriter from "../../services/service.response";

export default class ApiKeyRevokeController {
    static params_schema = z.object({
        id: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const { data: params_data, success } = ApiKeyRevokeController.params_schema.safeParse(
                req.params,
            );
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const api_key = await prisma.apiKey.findFirst({
                where: { id: params_data.id, userId: user.id },
                select: { id: true, revokedAt: true },
            });

            if (!api_key) {
                ResponseWriter.not_found(res, "Api key not found");
                return;
            }

            if (!api_key.revokedAt) {
                await prisma.apiKey.update({
                    where: { id: api_key.id },
                    data: { revokedAt: new Date() },
                });
            }

            ResponseWriter.success(res, {}, "Api key revoked successfully");
        } catch (err) {
            console.log("[claude-mcp:revoke_api_key] error while revoking api key", err);
            ResponseWriter.system_error(res);
        }
    }
}
