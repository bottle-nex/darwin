import type { Post, PostKind, PostStatus, ReleaseChannel } from "@trymatcha/types";

export type { Post, PostKind, PostStatus, ReleaseChannel };

/** What `GET /api/v1/content/:kind` returns per entry — no body, no draft fields. */
export type ContentSummary = Pick<
    Post,
    | "slug"
    | "title"
    | "summary"
    | "coverImage"
    | "author"
    | "tags"
    | "version"
    | "channel"
    | "readingTime"
> & { publishedAt: string | null };

/** What `GET /api/v1/content/:kind/:slug` returns — the full published entry. */
export type ContentEntry = ContentSummary & { content: string };
