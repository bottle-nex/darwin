import { z } from "zod";

export const post_kind_schema = z.enum(["Blog", "Changelog"]);

export const post_params_schema = z.object({ id: z.string().min(1) });

export const post_body_schema = z
    .object({
        kind: post_kind_schema,
        title: z.string().trim().min(1, "A title is required").max(140),
        slug: z.string().trim().max(160).optional(),
        summary: z.string().trim().max(280).optional(),
        content: z.string().min(1, "The post body is empty"),
        coverImage: z.url().max(2000).optional(),
        author: z.string().trim().max(80).optional(),
        tags: z.array(z.string().trim().min(1).max(32)).max(8).default([]),
        version: z.string().trim().max(40).optional(),
        channel: z.enum(["Beta", "Stable"]).optional(),
        status: z.enum(["Draft", "Published"]),
    })
    .refine((data) => data.kind !== "Changelog" || Boolean(data.version), {
        message: "A changelog entry needs a version",
        path: ["version"],
    })
    .refine((data) => data.kind !== "Changelog" || Boolean(data.channel), {
        message: "A changelog entry needs a channel",
        path: ["channel"],
    });

export type PostBody = z.infer<typeof post_body_schema>;
