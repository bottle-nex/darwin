import type { Priority } from "../types";

/**
 * The Custom Kanban is a Trello-style board the user builds by hand: free-form
 * columns ("lists") that hold cards. Unlike the agent-driven LLM Kanban, its
 * columns aren't tied to a fixed status flow — the user names them as they go.
 */

/** A card on a user-built column. `label` is a label name from `ALL_LABELS`. */
export type CustomCard = {
    id: string;
    title: string;
    description?: string;
    label?: string;
    priority: Priority;
};

/** A user-created column ("list") holding its ordered cards. */
export type CustomColumn = {
    id: string;
    title: string;
    cards: CustomCard[];
};

/** The fields the Add Card modal collects before a card is created. */
export type NewCardInput = {
    title: string;
    description: string;
    label?: string;
    priority: Priority;
};
