import type { CursorPage, IssueStatus } from "@trymatcha/types";
import type { BoardFilters } from "@/types/boardFilter";

/**
 * Shapes returned by `GET /issues/board/:project_id`. These mirror the server's
 * Prisma rows verbatim — raw, un-mapped. The kanban layer converts a `BoardIssue`
 * into its display card (priority number → label, status → KanbanStatus, etc.).
 */

/** A tag as the board projects it; the full `Tag` in `types/tags.ts` adds `createdAt`. */
export type BoardTag = {
    id: string;
    name: string;
    color: string;
};

/** The server's IssueStatus enum, as it arrives over JSON (the shared enum). */
export type ServerIssueStatus = IssueStatus;

/** A user on an issue. `name`/`image` are nullable on the User model. */
export type BoardAssignee = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
};

/** One issue row, with its assignees and tags. `priority` is the numeric scale (1=Urgent…4=Low). */
export type BoardIssue = {
    id: string;
    number: number;
    title: string;
    description: string;
    priority: number;
    status: ServerIssueStatus;
    customColumnId: string | null;
    createdAt: string;
    startDate: string | null;
    targetDate: string | null;
    prUrl: string | null;
    creator: BoardAssignee | null;
    assignees: BoardAssignee[];
    tags: BoardTag[];
};

/** A custom column row. `order` is its left-to-right board position. */
export type BoardColumn = {
    id: string;
    label: string;
    order: number;
};

/** The full board payload: every column and every issue for the project. */
export type BoardResponse = {
    columns: BoardColumn[];
    issues: BoardIssue[];
};

export type BoardLaneSelector =
    { type: "system"; status: ServerIssueStatus } | { type: "custom"; columnId: string };

export type BoardLane =
    { type: "system"; status: ServerIssueStatus } | { type: "custom"; columnId: string };

export type BoardMetadata = {
    columns: BoardColumn[];
    totals: {
        system: Partial<Record<ServerIssueStatus, number>>;
        custom: Record<string, number>;
    };
};

export type BoardIssuePage = CursorPage<BoardIssue>;

export type BoardSearchKey = {
    filters: BoardFilters;
    snapshot: string;
};
