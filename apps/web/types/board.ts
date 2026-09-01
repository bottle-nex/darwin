import type { CursorPage, IssueStatus } from "@trymatcha/types";

import type { IconPick } from "@/components/ui/IconPicker";
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
    /** Manual board/list position. Higher sorts first; drops write the midpoint of their neighbours. */
    sortOrder: number;
    createdAt: string;
    startDate: string | null;
    targetDate: string | null;
    prUrl: string | null;
    prNumber: number | null;
    prTitle: string | null;
    creator: BoardAssignee | null;
    assignees: BoardAssignee[];
    tags: BoardTag[];
};

/** One custom kanban board in a project. `order` is its position in the spaces list. */
export type BoardSpace = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    startDate: string | null;
    targetDate: string | null;
    order: number;
    icon: IconPick | null;
};

/** A custom column row. `order` is its left-to-right board position. */
export type BoardColumn = {
    id: string;
    spaceId: string;
    label: string;
    order: number;
};

/**
 * Which board a pane is showing. The agent board is the project's single
 * status-driven board; a space is one of its user-built boards.
 */
export type BoardScope = { kind: "agent" } | { kind: "space"; spaceId: string };

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
    spaces: BoardSpace[];
    columns: BoardColumn[];
    totals: {
        system: Partial<Record<ServerIssueStatus, number>>;
        custom: Record<string, number>;
        done: Record<string, number>;
    };
};

export type BoardIssuePage = CursorPage<BoardIssue>;

export type BoardSearchKey = {
    filters: BoardFilters;
    snapshot: string;
};
