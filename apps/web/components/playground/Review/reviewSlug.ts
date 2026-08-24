import { slugify } from "@/lib/format";
import type { BoardIssue } from "@/types/board";

export function reviewSlugFor(issue: Pick<BoardIssue, "title" | "prTitle">): string {
    return slugify(issue.prTitle ?? issue.title);
}
