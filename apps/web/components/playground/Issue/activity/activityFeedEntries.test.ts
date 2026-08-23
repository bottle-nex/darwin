import { describe, expect, test } from "bun:test";
import type { Chat, IssueActivity } from "@trymatcha/types";
import {
    buildActivityFeedEntries,
    coordinateTimelineCoverage,
    preserveTimelineAnchor,
    selectLimitingTimelineStream,
} from "./activityFeedEntries";

const at = (value: number) => new Date(value);

const activity = (
    id: string,
    timestamp: number,
    overrides: Partial<IssueActivity> = {},
): IssueActivity =>
    ({
        id,
        seq: overrides.seq ?? (id.replace(/\D/g, "") || "1"),
        issueId: "issue-1",
        sessionId: null,
        session: null,
        createdAt: at(timestamp),
        ...overrides,
    }) as IssueActivity;

const comment = (id: string, timestamp: number, overrides: Partial<Chat> = {}): Chat =>
    ({
        id,
        issueId: "issue-1",
        message: id,
        isDeleted: false,
        senderId: "user-1",
        sender: null,
        repliedToId: null,
        repliedTo: null,
        references: [],
        reactions: [],
        createdAt: at(timestamp),
        updatedAt: at(timestamp),
        ...overrides,
    }) as Chat;

describe("exclusive timeline coverage", () => {
    test("publishes only the interval covered by both interleaved streams", () => {
        const result = coordinateTimelineCoverage({
            activity: {
                items: [activity("a-90", 90), activity("a-110", 110)],
                hasMore: true,
            },
            comments: {
                items: [comment("c-100", 100), comment("c-120", 120)],
                hasMore: true,
            },
        });

        expect(result.watermark).toBe(100);
        expect(result.activities.map((row) => row.id)).toEqual(["a-110"]);
        expect(result.comments.map((row) => row.id)).toEqual(["c-120"]);
        expect(result.limitingStream).toBe("comments");
    });

    test("withholds equal-time buckets split in both streams until each advances beyond them", () => {
        const first = coordinateTimelineCoverage({
            activity: {
                items: [activity("a-1", 100), activity("a-2", 100)],
                hasMore: true,
            },
            comments: {
                items: [comment("c-1", 100), comment("c-2", 100)],
                hasMore: true,
            },
        });
        expect(first.activities).toEqual([]);
        expect(first.comments).toEqual([]);

        const oneAdvanced = coordinateTimelineCoverage({
            activity: {
                items: [
                    activity("a-0", 90),
                    activity("a-1", 100),
                    activity("a-2", 100),
                    activity("a-3", 100),
                ],
                hasMore: true,
            },
            comments: {
                items: [comment("c-1", 100), comment("c-2", 100)],
                hasMore: true,
            },
        });
        expect(oneAdvanced.activities).toEqual([]);
        expect(oneAdvanced.comments).toEqual([]);

        const bothAdvanced = coordinateTimelineCoverage({
            activity: {
                items: oneAdvanced.allActivities,
                hasMore: true,
            },
            comments: {
                items: [
                    comment("c-0", 80),
                    comment("c-1", 100),
                    comment("c-2", 100),
                    comment("c-3", 100),
                ],
                hasMore: true,
            },
        });

        expect(bothAdvanced.watermark).toBe(90);
        expect(bothAdvanced.activities.map((row) => row.id)).toEqual(["a-1", "a-2", "a-3"]);
        expect(bothAdvanced.comments.map((row) => row.id)).toEqual(["c-1", "c-2", "c-3"]);
    });

    test("ignores an exhausted stream and selects only a non-exhausted limiter", () => {
        const coverage = coordinateTimelineCoverage({
            activity: { items: [activity("a-20", 20)], hasMore: false },
            comments: { items: [comment("c-80", 80), comment("c-100", 100)], hasMore: true },
        });

        expect(coverage.watermark).toBe(80);
        expect(coverage.activities).toEqual([]);
        expect(selectLimitingTimelineStream(coverage, { activity: 0, comments: 3 })).toBe(null);
        expect(selectLimitingTimelineStream(coverage, { activity: 3, comments: 2 })).toBe(
            "comments",
        );
    });
});

describe("timeline feed entries", () => {
    test("flattens duplicate activity rows across pages instead of grouping them", () => {
        const entries = buildActivityFeedEntries(
            [
                activity("a-1", 100, { seq: "1", sessionId: "session-1" }),
                activity("a-2", 110, { seq: "2", sessionId: "session-1" }),
                activity("a-2", 110, { seq: "2", sessionId: "session-1" }),
            ],
            [],
        );

        expect(entries.map((entry) => entry.key)).toEqual(["activity:a-1", "activity:a-2"]);
        expect(entries.every((entry) => entry.kind === "activity")).toBe(true);
    });

    test("does not let embedded-root comment metadata cross the published boundary", () => {
        const root = comment("root", 80, { isDeleted: true });
        const reply = comment("reply", 110, { repliedToId: root.id, repliedTo: root });
        const coverage = coordinateTimelineCoverage({
            activity: {
                items: [activity("a-boundary", 100), activity("a-past-boundary", 110)],
                hasMore: true,
            },
            comments: {
                items: [comment("c-boundary", 100), reply],
                hasMore: true,
            },
        });
        const entries = buildActivityFeedEntries(coverage.activities, coverage.comments);

        expect(entries.map((entry) => [entry.key, entry.at])).toEqual([
            ["activity:a-past-boundary", 110],
            ["comment:root", 110],
        ]);
        expect(entries.every((entry) => entry.at > coverage.watermark!)).toBe(true);
    });

    test("regroups a reply under its deleted root snapshot before the root page loads", () => {
        const root = comment("root", 80, { isDeleted: true });
        const reply = comment("reply", 100, { repliedToId: root.id, repliedTo: root });

        const beforeRoot = buildActivityFeedEntries([], [reply]);
        expect(beforeRoot).toHaveLength(1);
        expect(beforeRoot[0].key).toBe("comment:root");
        expect(
            beforeRoot[0].kind === "comment" && beforeRoot[0].thread.replies.map((row) => row.id),
        ).toEqual(["reply"]);

        const afterRoot = buildActivityFeedEntries([], [reply, root, reply]);
        expect(afterRoot).toHaveLength(1);
        expect(
            afterRoot[0].kind === "comment" && afterRoot[0].thread.replies.map((row) => row.id),
        ).toEqual(["reply"]);
    });

    test("uses deterministic time, kind, and stable-ID ordering", () => {
        const entries = buildActivityFeedEntries(
            [activity("a-2", 100), activity("a-1", 100)],
            [comment("c-2", 100), comment("c-1", 100)],
        );

        expect(entries.map((entry) => entry.key)).toEqual([
            "activity:a-1",
            "activity:a-2",
            "comment:c-1",
            "comment:c-2",
        ]);
    });

    test("preserves an anchor through prepend and measurement growth", () => {
        expect(preserveTimelineAnchor(500, 640, 910)).toBe(770);
        expect(preserveTimelineAnchor(500, 640, 620)).toBe(480);
    });
});
