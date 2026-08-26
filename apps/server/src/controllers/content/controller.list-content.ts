import { type PostKind, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";

import ResponseWriter from "../../services/service.response";

const SUMMARY_FIELDS = {
    kind: true,
    slug: true,
    title: true,
    summary: true,
    coverImage: true,
    author: true,
    tags: true,
    version: true,
    channel: true,
    readingTime: true,
    publishedAt: true,
} as const;

export default class ListContentController {
    static handler(kind: PostKind) {
        return async (_req: Request, res: Response) => {
            try {
                const posts = await prisma.post.findMany({
                    where: { kind, status: "Published" },
                    orderBy: { publishedAt: "desc" },
                    select: SUMMARY_FIELDS,
                });

                return ResponseWriter.success(res, posts, "Content fetched");
            } catch (err) {
                console.error("[content:list]", err);
                return ResponseWriter.system_error(res);
            }
        };
    }
}
