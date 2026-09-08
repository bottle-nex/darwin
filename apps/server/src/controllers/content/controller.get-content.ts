import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";

const params_schema = z.object({ slug: z.string().min(1) });

export default class GetContentController {
    static async process(req: Request, res: Response) {
        const params = params_schema.safeParse(req.params);
        if (!params.success) {
            return ResponseWriter.invalid_data(res, "Slug required");
        }
        const { slug } = params.data;

        try {
            const post = await prisma.post.findUnique({ where: { slug } });

            if (!post || post.status !== "Published") {
                return ResponseWriter.not_found(res, "Not found");
            }

            return ResponseWriter.success(res, post, "Content fetched");
        } catch (err) {
            console.error("[content:get]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
