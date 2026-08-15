import type { Request, Response } from "express";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import PostContentService from "../../services/service.post-content";
import PostService from "../../services/service.post";
import { post_body_schema, post_params_schema } from "./post.schema";

export default class UpdatePostController {
    static async process(req: Request, res: Response) {
        const params = post_params_schema.safeParse(req.params);
        if (!params.success) {
            return ResponseWriter.invalid_data(res, "Post id required");
        }
        const { id } = params.data;

        const parsed = post_body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(
                res,
                parsed.error.issues[0]?.message ?? "Invalid post data",
            );
        }

        const input = parsed.data;

        try {
            const existing = await prisma.post.findUnique({ where: { id } });
            if (!existing) {
                return ResponseWriter.not_found(res, "Post not found");
            }

            const body = PostContentService.prepare(input.content);
            if (body.isEmpty) {
                return ResponseWriter.invalid_data(res, "The post body is empty");
            }

            const frozen = Boolean(existing.publishedAt);
            const slug = frozen
                ? existing.slug
                : await PostService.unique_slug(
                      input.kind,
                      input.slug || input.title,
                      input.title,
                      existing.id,
                  );

            const post = await prisma.post.update({
                where: { id },
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
                    publishedAt:
                        input.status === "Published"
                            ? (existing.publishedAt ?? new Date())
                            : existing.publishedAt,
                },
            });

            return ResponseWriter.success(res, post, "Post updated");
        } catch (err) {
            console.error("[admin:update-post]", err);
            return ResponseWriter.system_error(res);
        }
    }
}
