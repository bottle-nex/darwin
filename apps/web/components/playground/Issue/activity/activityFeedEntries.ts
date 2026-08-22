import type { AgentSession, Chat, IssueActivity } from "@trymatcha/types";
import type { CommentThread } from "./CommentCard";

export type TimelineStream = "activity" | "comments";

export type TimelineCoverage = {
    activities: IssueActivity[];
    comments: Chat[];
    allActivities: IssueActivity[];
    allComments: Chat[];
    watermark: number | null;
    limitingStream: TimelineStream | null;
    boundaries: Record<TimelineStream, number | null>;
};

export type ActivityFeedEntry =
    | {
          kind: "activity";
          key: string;
          at: number;
          activity: IssueActivity;
      }
    | {
          kind: "session";
          key: string;
          at: number;
          session: AgentSession;
          rows: IssueActivity[];
      }
    | {
          kind: "comment";
          key: string;
          at: number;
          thread: CommentThread;
      };

function millis(value: string | Date) {
    return new Date(value).getTime();
}

function deduplicateById<T extends { id: string }>(items: readonly T[]) {
    const byId = new Map<string, T>();
    for (const item of items) {
        if (!byId.has(item.id)) byId.set(item.id, item);
    }
    return [...byId.values()];
}

function chronological<T extends { id: string; createdAt: string | Date }>(items: readonly T[]) {
    return deduplicateById(items).sort(
        (left, right) =>
            millis(left.createdAt) - millis(right.createdAt) || left.id.localeCompare(right.id),
    );
}

function exclusiveBoundary<T extends { createdAt: string | Date }>(
    items: readonly T[],
    hasMore: boolean,
) {
    if (!hasMore) return null;
    if (items.length === 0) return Number.POSITIVE_INFINITY;
    return Math.min(...items.map((item) => millis(item.createdAt)));
}

export function coordinateTimelineCoverage({
    activity,
    comments,
}: {
    activity: { items: readonly IssueActivity[]; hasMore: boolean };
    comments: { items: readonly Chat[]; hasMore: boolean };
}): TimelineCoverage {
    const allActivities = chronological(activity.items);
    const allComments = chronological(comments.items);
    const boundaries = {
        activity: exclusiveBoundary(allActivities, activity.hasMore),
        comments: exclusiveBoundary(allComments, comments.hasMore),
    };
    const activeBoundaries = Object.values(boundaries).filter(
        (boundary): boundary is number => boundary !== null,
    );
    const watermark = activeBoundaries.length > 0 ? Math.max(...activeBoundaries) : null;
    const limitingStream =
        watermark === null ? null : boundaries.activity === watermark ? "activity" : "comments";
    const covered = <T extends { createdAt: string | Date }>(item: T) =>
        watermark === null || millis(item.createdAt) > watermark;

    return {
        activities: allActivities.filter(covered),
        comments: allComments.filter(covered),
        allActivities,
        allComments,
        watermark,
        limitingStream,
        boundaries,
    };
}

export function selectLimitingTimelineStream(
    coverage: TimelineCoverage,
    fetchedPagesInCycle: Record<TimelineStream, number>,
    pageCap = 3,
): TimelineStream | null {
    if (coverage.watermark === null) return null;
    const limitingStreams = (["activity", "comments"] as const).filter(
        (stream) => coverage.boundaries[stream] === coverage.watermark,
    );
    const eligibleStreams = limitingStreams.filter(
        (stream) => fetchedPagesInCycle[stream] < pageCap,
    );
    if (eligibleStreams.length === 0) return null;
    return eligibleStreams.sort(
        (left, right) =>
            fetchedPagesInCycle[left] - fetchedPagesInCycle[right] || left.localeCompare(right),
    )[0];
}

function buildCommentThreads(comments: readonly Chat[]) {
    const loadedComments = chronological(comments);
    const relatedComments = new Map<string, Chat>();
    for (const comment of loadedComments) {
        if (comment.repliedTo && !relatedComments.has(comment.repliedTo.id)) {
            relatedComments.set(comment.repliedTo.id, comment.repliedTo);
        }
    }
    for (const comment of loadedComments) relatedComments.set(comment.id, comment);

    const rootOf = (comment: Chat) => {
        const seen = new Set([comment.id]);
        let current = comment;
        while (current.repliedToId) {
            const parent = relatedComments.get(current.repliedToId);
            if (!parent || seen.has(parent.id)) break;
            seen.add(parent.id);
            current = parent;
        }
        return current;
    };

    const threads = new Map<string, { thread: CommentThread; publishedAt: number }>();
    for (const comment of loadedComments) {
        const root = rootOf(comment);
        const held = threads.get(root.id);
        const thread = held?.thread ?? { root, replies: [] };
        threads.set(root.id, {
            thread,
            publishedAt: Math.min(
                held?.publishedAt ?? Number.POSITIVE_INFINITY,
                millis(comment.createdAt),
            ),
        });
        if (comment.id !== root.id) thread.replies.push(comment);
    }

    return [...threads.values()]
        .map(({ thread, publishedAt }) => ({
            thread: { ...thread, replies: chronological(thread.replies) },
            publishedAt,
        }))
        .filter(({ thread }) => !thread.root.isDeleted || thread.replies.length > 0);
}

function compareActivitySequence(left: IssueActivity, right: IssueActivity) {
    const leftSequence = BigInt(left.seq);
    const rightSequence = BigInt(right.seq);
    if (leftSequence < rightSequence) return -1;
    if (leftSequence > rightSequence) return 1;
    return left.id.localeCompare(right.id);
}

export function buildActivityFeedEntries(
    activities: readonly IssueActivity[],
    comments: readonly Chat[],
): ActivityFeedEntry[] {
    const chronologicalActivities = deduplicateById(activities).sort(compareActivitySequence);
    const groupedActivities = new Map<string, IssueActivity[]>();
    for (const activity of chronologicalActivities) {
        if (!activity.sessionId) continue;
        const group = groupedActivities.get(activity.sessionId) ?? [];
        group.push(activity);
        groupedActivities.set(activity.sessionId, group);
    }

    const entries: ActivityFeedEntry[] = [];
    const emittedSessions = new Set<string>();
    for (const activity of chronologicalActivities) {
        const group = activity.sessionId ? groupedActivities.get(activity.sessionId) : undefined;
        const session = group?.find((row) => row.session)?.session;
        if (!activity.sessionId || !group || !session) {
            entries.push({
                kind: "activity",
                key: `activity:${activity.id}`,
                at: millis(activity.createdAt),
                activity,
            });
            continue;
        }
        if (emittedSessions.has(activity.sessionId)) continue;
        emittedSessions.add(activity.sessionId);
        entries.push({
            kind: "session",
            key: `session:${session.id}`,
            at: Math.min(...group.map((row) => millis(row.createdAt))),
            session,
            rows: group,
        });
    }

    for (const { thread, publishedAt } of buildCommentThreads(comments)) {
        entries.push({
            kind: "comment",
            key: `comment:${thread.root.id}`,
            at: publishedAt,
            thread,
        });
    }

    const kindOrder: Record<ActivityFeedEntry["kind"], number> = {
        activity: 0,
        session: 1,
        comment: 2,
    };
    return entries.sort(
        (left, right) =>
            left.at - right.at ||
            kindOrder[left.kind] - kindOrder[right.kind] ||
            left.key.localeCompare(right.key),
    );
}

export function preserveTimelineAnchor(
    scrollTop: number,
    previousAnchorStart: number,
    nextAnchorStart: number,
) {
    return scrollTop + nextAnchorStart - previousAnchorStart;
}
