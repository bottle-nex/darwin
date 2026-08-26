import { prisma } from "@trymatcha/database";
import type { Request, Response } from "express";

import PostContentService from "../../services/service.post-content";
import PostSlugService from "../../services/service.post-slug";
import ResponseWriter from "../../services/service.response";
import RevalidateService from "../../services/service.revalidate";
import { post_body_schema } from "./post.schema";

export default class CreatePostController {
    static async process(req: Request, res: Response) {
        const parsed = post_body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(
                res,
                parsed.error.issues[0]?.message ?? "Invalid post data",
            );
        }

        const input = parsed.data;

        try {
            const body = PostContentService.prepare(input.content);
            if (body.isEmpty) {
                return ResponseWriter.invalid_data(res, "The post body is empty");
            }

            const slug = await PostSlugService.unique(input.slug || input.title, input.title);

            const post = await prisma.post.create({
                data: {
                    kind: input.kind,
                    slug,
                    title: input.title,
                    summary: input.summary ?? null,
                    content: body.content,
                    plainText: body.plainText,
                    coverImage: input.coverImage ?? null,
                    author: input.author ?? null,
                    tags: input.tags,
                    version: input.version ?? null,
                    channel: input.channel ?? null,
                    status: input.status,
                    readingTime: body.readingTime,
                    publishedAt: input.status === "Published" ? new Date() : null,
                },
            });

            RevalidateService.content();

            return ResponseWriter.created(res, post, "Post created");
        } catch (err) {
            console.error("[admin:create-post]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
