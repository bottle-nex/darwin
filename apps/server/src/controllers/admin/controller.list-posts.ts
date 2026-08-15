import type { Request, Response } from "express";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import { post_kind_schema } from "./post.schema";

export default class ListPostsController {
    static async process(req: Request, res: Response) {
        const kind = post_kind_schema.safeParse(req.query.kind);

        try {
            const posts = await prisma.post.findMany({
                where: kind.success ? { kind: kind.data } : undefined,
                orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
                select: {
                    id: true,
                    kind: true,
                    slug: true,
                    title: true,
                    summary: true,
                    status: true,
                    version: true,
                    channel: true,
                    author: true,
                    readingTime: true,
                    publishedAt: true,
                    updatedAt: true,
                },
            });

            return ResponseWriter.success(res, posts, "Posts fetched");
        } catch (err) {
            console.error("[admin:list-posts]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
