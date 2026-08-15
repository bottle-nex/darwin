import type { Request, Response } from "express";
import { prisma, type PostKind } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";

const SUMMARY_FIELDS = {
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
    /**
     * The changelog index renders every release in full, so it carries `content`.
     * The blog index only lists, so it does not.
     */
    static handler(kind: PostKind) {
        const select = kind === "Changelog" ? { ...SUMMARY_FIELDS, content: true } : SUMMARY_FIELDS;

        return async (_req: Request, res: Response) => {
            try {
                const posts = await prisma.post.findMany({
                    where: { kind, status: "Published" },
                    orderBy: { publishedAt: "desc" },
                    select,
                });

                return ResponseWriter.success(res, posts, "Content fetched");
            } catch (err) {
                console.error("[content:list]", err);
                return ResponseWriter.system_error(res);
            }
        };
    }
}
