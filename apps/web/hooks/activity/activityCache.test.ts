import { describe, expect, spyOn, test } from "bun:test";
import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import type { AgentSession, IssueActivity } from "@trymatcha/types";
import {
    activityPageParams,
    appendActivitiesToNewestPage,
    flattenActivityPages,
    updateAgentSessionInPages,
    type ActivityPage,
} from "./activityCache";
import { append_activities } from "./useActivity";

const activity = (id: string, seq: number, overrides: Partial<IssueActivity> = {}): IssueActivity =>
    ({
        id,
        seq: String(seq),
        issueId: "issue-1",
        sessionId: null,
        session: null,
        createdAt: new Date(2026, 0, 1, 0, 0, seq),
        ...overrides,
    }) as IssueActivity;

const page = (activities: IssueActivity[], nextCursor: string | null): ActivityPage => ({
    activities,
    nextCursor,
    hasMore: nextCursor !== null,
});

const data = (): InfiniteData<ActivityPage, string | null> => ({
    pages: [
        page([activity("new-1", 5), activity("new-2", 6)], "5"),
        page([activity("old-1", 2), activity("old-2", 3)], "2"),
    ],
    pageParams: [null, "5"],
});

describe("activity infinite cache", () => {
    test("sends the default limit and advances before from the prior page cursor", () => {
        expect(activityPageParams(null)).toEqual({ limit: 100 });
        expect(activityPageParams("42")).toEqual({ limit: 100, before: "42" });
    });

    test("flattens older pages chronologically with newest-page duplicate priority", () => {
        const source = data();
        source.pages[1].activities.push(activity("new-1", 5, { actorWorkerId: "stale" }));

        expect(
            flattenActivityPages(source.pages).map((row) => [row.id, row.actorWorkerId ?? null]),
        ).toEqual([
            ["old-1", null],
            ["old-2", null],
            ["new-1", null],
            ["new-2", null],
        ]);
    });

    test("keeps one socket row at the newest edge while an older page arrives", () => {
        const incoming = activity("live", 7);
        const withSocket = appendActivitiesToNewestPage(data(), [incoming]);
        const withOlderFetch = {
            ...withSocket,
            pages: [...withSocket.pages, page([activity("oldest", 1), incoming], null)],
            pageParams: [...withSocket.pageParams, "2"],
        };

        expect(flattenActivityPages(withOlderFetch.pages).map((row) => row.id)).toEqual([
            "oldest",
            "old-1",
            "old-2",
            "new-1",
            "new-2",
            "live",
        ]);
        expect(withOlderFetch.pages[0].nextCursor).toBe("5");
    });

    test("updates session snapshots across every loaded page", () => {
        const session = {
            id: "session-1",
            issueId: "issue-1",
            status: "Succeeded",
        } as AgentSession;
        const source = data();
        source.pages[0].activities[0] = activity("new-1", 5, {
            sessionId: session.id,
        });
        source.pages[1].activities[0] = activity("old-1", 2, {
            sessionId: session.id,
        });

        const updated = updateAgentSessionInPages(source, session);

        expect(
            flattenActivityPages(updated.pages)
                .filter((row) => row.sessionId === session.id)
                .every((row) => row.session === session),
        ).toBe(true);
    });

    test("invalidates an in-flight activity feed when a socket row arrives before data", () => {
        const queryClient = new QueryClient();
        const invalidate = spyOn(queryClient, "invalidateQueries");

        append_activities(queryClient, "issue-1", [activity("live", 7)]);

        expect(invalidate).toHaveBeenCalledWith({
            queryKey: ["activity", "issue-1"],
            exact: true,
        });
    });
});
