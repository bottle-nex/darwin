import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";

import ResponseWriter from "../../services/service.response";
import RevalidateService from "../../services/service.revalidate";
import { post_params_schema } from "./post.schema";

export default class DeletePostController {
    static async process(req: Request, res: Response) {
        const params = post_params_schema.safeParse(req.params);
        if (!params.success) {
            return ResponseWriter.invalid_data(res, "Post id required");
        }
        const { id } = params.data;

        try {
            const existing = await prisma.post.findUnique({ where: { id }, select: { id: true } });
            if (!existing) {
                return ResponseWriter.not_found(res, "Post not found");
            }

            await prisma.post.delete({ where: { id } });

            RevalidateService.content();

            return ResponseWriter.success(res, { id }, "Post deleted");
        } catch (err) {
            console.error("[admin:delete-post]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
