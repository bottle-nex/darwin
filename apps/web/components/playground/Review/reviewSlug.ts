import type { BoardIssue } from "@/types/board";
import { slugify } from "@/lib/format";

export function reviewSlugFor(issue: Pick<BoardIssue, "title" | "prTitle">): string {
    return slugify(issue.prTitle ?? issue.title);
}
