import type { DarwinIssueCard } from "@trydarwin/types";

import type { BoardIssueRow } from "../../service.board-issues";

/** The pane collapses a list at 8, so a 13th card is weight nobody sees. */
export const MAX_CARDS = 12;
const MAX_CARD_PEOPLE = 6;
const MAX_CARD_TAGS = 6;
const MAX_RESULT_BYTES = 8000;

/**
 * Collapse whitespace and cut to a length, with an ellipsis when cut.
 *
 * @example
 * truncate("a   long\n\nbody", 6); // "a long…"
 */
export function truncate(text: string, limit: number): string {
    const collapsed = text.replace(/\s+/g, " ").trim();
    return collapsed.length <= limit ? collapsed : `${collapsed.slice(0, limit)}…`;
}

/**
 * Strip a board row down to what a language model can act on in a list.
 *
 * No description: twenty of them at 280 characters overran the byte cap, and the model then read
 * its own truncation note and told the user the list was too long to show. A body belongs on a
 * single issue, which `get_issue` returns in full.
 *
 * A tool result is resent to the model on every later iteration of the same loop, so the cost of
 * a fat projection is paid per round, not once.
 *
 * @example
 * trim_issue(row);
 * // { number: 142, title: "Login fails on Safari", status: "InProgress", priority: 1, ... }
 */
export function trim_issue(issue: BoardIssueRow) {
    return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        status: issue.status,
        priority: issue.priority,
        assignees: issue.assignees.map((user) => user.name ?? user.email),
        tags: issue.tags.map((tag) => tag.name),
        targetDate: issue.targetDate ? issue.targetDate.toISOString().slice(0, 10) : null,
    };
}

/**
 * The same issue, for the card rather than the model.
 *
 * Carries the ids `trim_issue` drops: an assignee id is what `toneFor` hashes to keep a person the
 * same colour across the app, a tag's hex is its chip dot, and the issue id is what a click opens.
 *
 * @example
 * card_issue(row);
 * // { id: "cl…", number: 142, tags: [{ id: "cl…", name: "bug", color: "#e5484d" }], … }
 */
export function card_issue(issue: BoardIssueRow): DarwinIssueCard {
    return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        status: issue.status,
        priority: issue.priority,
        column: null,
        assignees: issue.assignees.slice(0, MAX_CARD_PEOPLE).map((user) => ({
            id: user.id,
            name: user.name ?? user.email,
            image: user.image ?? null,
        })),
        tags: issue.tags
            .slice(0, MAX_CARD_TAGS)
            .map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
        targetDate: issue.targetDate ? issue.targetDate.toISOString().slice(0, 10) : null,
    };
}

/**
 * Last-resort byte cap so one careless tool cannot fill the context window.
 *
 * The note is written for the model: it reads "narrow your query" and asks again with a filter
 * rather than reporting a failure to the user.
 *
 * @example
 * trim_tool_result(fourThousandRows);
 * // { items: [...10], truncated: true, note: "Result truncated. Narrow your query." }
 */
export function trim_tool_result(result: unknown): unknown {
    const encoded = JSON.stringify(result ?? null);
    if (encoded.length <= MAX_RESULT_BYTES) return result;
    if (Array.isArray(result)) {
        return {
            items: result.slice(0, 10),
            truncated: true,
            note: "Only part of this reached you. The user can see the whole list on screen.",
        };
    }
    return {
        truncated: true,
        note: "This was too large to hand you. The user can see it on screen.",
    };
}
