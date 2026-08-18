import { ActivitySurface, ActivityType, IssueStatus } from "@trymatcha/database";
import type { ActivityLocationRef } from "@trymatcha/types";
import type { ActivityEvent } from "./service.activity";

/**
 * Collapses the (status, customColumn) pair into the one thing it represents.
 * `Parked` only ever means "see customColumn", so it never survives this.
 */
export function location_of(
    status: IssueStatus,
    column: { id: string; label: string } | null,
): ActivityLocationRef {
    if (column) return { kind: "column", id: column.id, label: column.label };
    return { kind: "status", status };
}

function same_location(a: ActivityLocationRef, b: ActivityLocationRef): boolean {
    if (a.kind === "column" || b.kind === "column") {
        return a.kind === "column" && b.kind === "column" && a.id === b.id;
    }
    return a.status === b.status;
}

export type IssueSnapshot = {
    title: string;
    description: string;
    priority: number;
    status: IssueStatus;
    customColumn: { id: string; label: string } | null;
    startDate: Date | null;
    targetDate: Date | null;
    assignees: { id: string; name: string | null; image: string | null }[];
    tags: { id: string; name: string; color: string }[];
};

function iso(date: Date | null) {
    return date ? date.toISOString() : null;
}

function same_instant(a: Date | null, b: Date | null) {
    return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}

/**
 * Pure. Deliberately not folded into `IssueUpdateController.notify` — that one
 * fires on priority only for P1 escalation and treats a column move and a status
 * change as mutually exclusive, both of which are wrong for a timeline.
 */
export function diff_issue(before: IssueSnapshot, after: IssueSnapshot): ActivityEvent[] {
    const events: ActivityEvent[] = [];

    if (before.title !== after.title) {
        events.push({
            type: ActivityType.TitleChanged,
            payload: { from: before.title, to: after.title },
        });
    }

    if (before.description !== after.description) {
        // The body itself is rich-text HTML — too large to freeze into a payload,
        // and the issue already renders the current version above the feed.
        events.push({ type: ActivityType.DescriptionChanged });
    }

    if (before.priority !== after.priority) {
        events.push({
            type: ActivityType.PriorityChanged,
            payload: { from: before.priority, to: after.priority },
        });
    }

    const from_location = location_of(before.status, before.customColumn);
    const to_location = location_of(after.status, after.customColumn);
    if (!same_location(from_location, to_location)) {
        events.push({
            type: ActivityType.StatusChanged,
            payload: { from: from_location, to: to_location },
        });
    }

    if (
        !same_instant(before.startDate, after.startDate) ||
        !same_instant(before.targetDate, after.targetDate)
    ) {
        events.push({
            type: ActivityType.DatesChanged,
            payload: {
                from: { startDate: iso(before.startDate), targetDate: iso(before.targetDate) },
                to: { startDate: iso(after.startDate), targetDate: iso(after.targetDate) },
            },
            surface: ActivitySurface.Secondary,
        });
    }

    const before_tags = new Map(before.tags.map((tag) => [tag.id, tag]));
    const after_tags = new Map(after.tags.map((tag) => [tag.id, tag]));

    for (const [id, tag] of after_tags) {
        if (before_tags.has(id)) continue;
        events.push({ type: ActivityType.LabelAdded, payload: { label: tag } });
    }
    for (const [id, tag] of before_tags) {
        if (after_tags.has(id)) continue;
        events.push({ type: ActivityType.LabelRemoved, payload: { label: tag } });
    }

    const before_assignees = new Map(before.assignees.map((user) => [user.id, user]));
    const after_assignees = new Map(after.assignees.map((user) => [user.id, user]));

    for (const [id, user] of after_assignees) {
        if (before_assignees.has(id)) continue;
        events.push({ type: ActivityType.AssigneeAdded, payload: { user } });
    }
    for (const [id, user] of before_assignees) {
        if (after_assignees.has(id)) continue;
        events.push({ type: ActivityType.AssigneeRemoved, payload: { user } });
    }

    return events;
}
