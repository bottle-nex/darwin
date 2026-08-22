import { describe, expect, test } from "bun:test";
import {
    activeStickyRowIndex,
    chunkIssueRows,
    flattenGroupedIssueRows,
    loadedIssueSelectionIds,
    preservePrependScrollTop,
    shouldPrefetchNextIssuePage,
    stickyHeaderPushOffset,
} from "./virtualizedIssueRows";

type RowIssue = {
    id: string;
};

const issues = (count: number): RowIssue[] =>
    Array.from({ length: count }, (_, index) => ({ id: `issue-${index + 1}` }));

describe("virtualized issue rows", () => {
    test.each([1, 2, 3, 4])("preserves row-major order across %i columns", (columns) => {
        const source = issues(11);
        const rows = chunkIssueRows(source, columns, (issue) => issue.id);

        expect(rows.flatMap((row) => row.items)).toEqual(source);
        expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
        expect(rows.every((row) => row.items.length <= columns)).toBe(true);
    });

    test("keeps issue keys stable when responsive rows are rechunked", () => {
        const source = issues(9);
        const keysAtTwoColumns = chunkIssueRows(source, 2, (issue) => issue.id).flatMap(
            (row) => row.itemKeys,
        );
        const keysAtFourColumns = chunkIssueRows(source, 4, (issue) => issue.id).flatMap(
            (row) => row.itemKeys,
        );

        expect(keysAtFourColumns).toEqual(keysAtTwoColumns);
        expect(new Set(keysAtFourColumns).size).toBe(source.length);
    });

    test("flattens grouped headers and issues without changing issue order or keys", () => {
        const rows = flattenGroupedIssueRows(
            [
                { key: "todo", issues: [{ id: "1" }, { id: "2" }] },
                { key: "done", issues: [{ id: "3" }] },
            ],
            (issue) => issue.id,
            true,
        );

        expect(rows.map((row) => row.key)).toEqual([
            "group:todo",
            "issue:1",
            "issue:2",
            "group-end:todo",
            "group:done",
            "issue:3",
            "group-end:done",
        ]);
        expect(rows.filter((row) => row.kind === "issue").map((row) => row.issue.id)).toEqual([
            "1",
            "2",
            "3",
        ]);
    });

    test("keeps collapsed group headers while omitting their issues and pagination row", () => {
        const rows = flattenGroupedIssueRows(
            [
                { key: "todo", issues: [{ id: "1" }, { id: "2" }] },
                { key: "done", issues: [{ id: "3" }] },
            ],
            (issue) => issue.id,
            true,
            new Set(["todo"]),
        );

        expect(rows.map((row) => row.key)).toEqual([
            "group:todo",
            "group:done",
            "issue:3",
            "group-end:done",
        ]);
    });

    test("selects each displayed loaded issue once and never infers unloaded rows", () => {
        const loaded = [{ id: "1" }, { id: "2" }, { id: "2" }, { id: "3" }];

        expect(loadedIssueSelectionIds(loaded, (issue) => issue.id)).toEqual(["1", "2", "3"]);
        expect(loadedIssueSelectionIds([], (issue: RowIssue) => issue.id)).toEqual([]);
    });

    test("keeps the visible lane anchor when older rows prepend", () => {
        expect(preservePrependScrollTop(420, 900, 1420)).toBe(940);
        expect(preservePrependScrollTop(420, 900, 760)).toBe(420);
    });

    test("prefetches after roughly 25 of 30 issue cards have been passed", () => {
        expect(shouldPrefetchNextIssuePage(5000, 3519, 700)).toBe(false);
        expect(shouldPrefetchNextIssuePage(5000, 3520, 700)).toBe(true);
        expect(shouldPrefetchNextIssuePage(5000, 4000, 700)).toBe(true);
    });

    test("keeps the current group header active until the next group starts", () => {
        const groupIndexes = [0, 33, 65];

        expect(activeStickyRowIndex(groupIndexes, 0)).toBe(0);
        expect(activeStickyRowIndex(groupIndexes, 25)).toBe(0);
        expect(activeStickyRowIndex(groupIndexes, 33)).toBe(33);
        expect(activeStickyRowIndex(groupIndexes, 64)).toBe(33);
        expect(activeStickyRowIndex(groupIndexes, 65)).toBe(65);
        expect(activeStickyRowIndex(groupIndexes, -1)).toBe(-1);
    });

    test("pushes the current header out as the next header reaches it", () => {
        expect(stickyHeaderPushOffset(500, 400, 44)).toBe(0);
        expect(stickyHeaderPushOffset(500, 470, 44)).toBe(-14);
        expect(stickyHeaderPushOffset(500, 500, 44)).toBe(-44);
        expect(stickyHeaderPushOffset(500, 540, 44)).toBe(-44);
    });
});
