import type { InfiniteData } from "@tanstack/react-query";
import type { AgentSession, IssueActivity } from "@trymatcha/types";

export const ACTIVITY_PAGE_LIMIT = 100;
export const ACTIVITY_AUTO_FILL_PAGE_CAP = 3;
export const ACTIVITY_VIRTUAL_OVERSCAN = 6;

export type ActivityPage = {
    activities: IssueActivity[];
    nextCursor: string | null;
    hasMore: boolean;
};

export type ActivityInfiniteData = InfiniteData<ActivityPage, string | null>;

export function activityPageParams(before: string | null) {
    return before ? { limit: ACTIVITY_PAGE_LIMIT, before } : { limit: ACTIVITY_PAGE_LIMIT };
}

function compareSequence(left: IssueActivity, right: IssueActivity) {
    const leftSequence = BigInt(left.seq);
    const rightSequence = BigInt(right.seq);
    if (leftSequence < rightSequence) return -1;
    if (leftSequence > rightSequence) return 1;
    return left.id.localeCompare(right.id);
}

export function flattenActivityPages(pages: readonly ActivityPage[]) {
    const newestValues = new Map<string, { activity: IssueActivity; pageIndex: number }>();
    pages.forEach((page, pageIndex) => {
        for (const activity of page.activities) {
            if (!newestValues.has(activity.id)) {
                newestValues.set(activity.id, { activity, pageIndex });
            }
        }
    });

    const activities: IssueActivity[] = [];
    for (let pageIndex = pages.length - 1; pageIndex >= 0; pageIndex -= 1) {
        for (const activity of pages[pageIndex].activities) {
            const newestValue = newestValues.get(activity.id);
            if (newestValue?.pageIndex === pageIndex) activities.push(newestValue.activity);
        }
    }
    return activities.sort(compareSequence);
}

function removeActivityIds(data: ActivityInfiniteData, activityIds: ReadonlySet<string>) {
    let pages: ActivityPage[] | undefined;
    data.pages.forEach((page, pageIndex) => {
        const activities = page.activities.filter((activity) => !activityIds.has(activity.id));
        if (activities.length === page.activities.length) return;
        pages ??= data.pages.slice();
        pages[pageIndex] = { ...page, activities };
    });
    return pages ? { ...data, pages } : data;
}

export function appendActivitiesToNewestPage(
    data: ActivityInfiniteData,
    incomingActivities: readonly IssueActivity[],
) {
    const incomingById = new Map(incomingActivities.map((activity) => [activity.id, activity]));
    if (incomingById.size === 0) return data;

    const deduplicated = removeActivityIds(data, new Set(incomingById.keys()));
    const incoming = [...incomingById.values()];
    if (deduplicated.pages.length === 0) {
        return {
            ...deduplicated,
            pages: [
                { activities: incoming.sort(compareSequence), nextCursor: null, hasMore: false },
            ],
            pageParams: [null],
        };
    }

    const pages = deduplicated.pages.slice();
    pages[0] = {
        ...pages[0],
        activities: [...pages[0].activities, ...incoming].sort(compareSequence),
    };
    return { ...deduplicated, pages };
}

export function updateAgentSessionInPages(data: ActivityInfiniteData, session: AgentSession) {
    let pages: ActivityPage[] | undefined;
    data.pages.forEach((page, pageIndex) => {
        let activities: IssueActivity[] | undefined;
        page.activities.forEach((activity, activityIndex) => {
            if (activity.sessionId !== session.id || activity.session === session) return;
            activities ??= page.activities.slice();
            activities[activityIndex] = { ...activity, session };
        });
        if (!activities) return;
        pages ??= data.pages.slice();
        pages[pageIndex] = { ...page, activities };
    });
    return pages ? { ...data, pages } : data;
}
