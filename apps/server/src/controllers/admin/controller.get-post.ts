import type { Request, Response } from "express";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import { post_params_schema } from "./post.schema";

export default class GetPostController {
    static async process(req: Request, res: Response) {
        const params = post_params_schema.safeParse(req.params);
        if (!params.success) {
            return ResponseWriter.invalid_data(res, "Post id required");
        }
        const { id } = params.data;

        try {
            const post = await prisma.post.findUnique({ where: { id } });
            if (!post) {
                return ResponseWriter.not_found(res, "Post not found");
            }

            return ResponseWriter.success(res, post, "Post fetched");
        } catch (err) {
            console.error("[admin:get-post]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
