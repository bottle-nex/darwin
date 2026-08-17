import type { Post, PostKind, ReleaseChannel } from "@trymatcha/types";

export type { PostKind, ReleaseChannel };

export type ContentSummary = Pick<
    Post,
    | "kind"
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

export type ContentEntry = ContentSummary & { content: string };
