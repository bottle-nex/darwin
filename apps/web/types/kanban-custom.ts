import type { Assignee, Priority } from "@/types/kanban";
import type { BoardTag } from "@/types/board";

/**
 * The Custom Kanban is a Trello-style board the user builds by hand: free-form
 * columns ("lists") that hold cards. Unlike the agent-driven LLM Kanban, its
 * columns aren't tied to a fixed status flow — the user names them as they go.
 */

/**
 * A card on a user-built column — the display view of a server Issue parked in a
 * custom column. `number` is the server's per-project issue number (absent only
 * for an optimistic card awaiting its server row).
 */
export type CustomCard = {
    id: string;
    number?: number;
    title: string;
    description?: string;
    tags: BoardTag[];
    priority: Priority;
    assignees: Assignee[];
};

/** A user-created column ("list") holding its ordered cards. */
export type CustomColumn = {
    id: string;
    title: string;
    cards: CustomCard[];
};
