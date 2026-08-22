import { describe, expect, test } from "bun:test";
import {
    normalizeBoardFilters,
    resolveBoardFilterFallback,
    serializeBoardFilters,
} from "./boardCache";
import { EMPTY_FILTERS, type BoardFilters } from "@/types/boardFilter";
import type { BoardIssue } from "@/types/board";

const issue = (id: string, title: string): BoardIssue => ({
    id,
    number: Number(id),
    title,
    description: "",
    priority: 3,
    status: "Todo",
    customColumnId: null,
    createdAt: "2026-08-22T01:00:00.000Z",
    startDate: null,
    targetDate: null,
    prUrl: null,
    prNumber: null,
    prTitle: null,
    creator: null,
    assignees: [],
    tags: [],
});

const withQuery = (query: string): BoardFilters => ({ ...EMPTY_FILTERS, query });

describe("board filter fallback", () => {
    test("a loaded local match suppresses backend fallback", () => {
        const result = resolveBoardFilterFallback(
            [issue("1", "Matching issue")],
            withQuery("matching"),
            true,
        );

        expect(result.localRows.map((row) => row.id)).toEqual(["1"]);
        expect(result.fallbackEnabled).toBe(false);
    });

    test("status facets apply to system lanes and preserve custom-lane matches", () => {
        const customIssue: BoardIssue = {
            ...issue("2", "Custom issue"),
            status: "Parked",
            customColumnId: "column-1",
        };
        const result = resolveBoardFilterFallback(
            [issue("1", "System issue"), customIssue],
            { ...EMPTY_FILTERS, statuses: ["Todo"] },
            true,
        );

        expect(result.localRows.map((row) => row.id)).toEqual(["1", "2"]);
        expect(result.fallbackEnabled).toBe(false);
    });

    test("zero loaded matches enables fallback only after base pages settle", () => {
        const loading = resolveBoardFilterFallback(
            [issue("1", "Different issue")],
            withQuery("missing"),
            false,
        );
        const settled = resolveBoardFilterFallback(
            [issue("1", "Different issue")],
            withQuery("missing"),
            true,
        );

        expect(loading.fallbackEnabled).toBe(false);
        expect(settled.fallbackEnabled).toBe(true);
    });

    test("clearing filters restores base rows and disables fallback", () => {
        const result = resolveBoardFilterFallback(
            [issue("1", "Different issue")],
            EMPTY_FILTERS,
            true,
        );

        expect(result.localRows.map((row) => row.id)).toEqual(["1"]);
        expect(result.fallbackEnabled).toBe(false);
        expect(result.filtersActive).toBe(false);
    });

    test("normalizes equivalent filters to one stable query key", () => {
        const left = normalizeBoardFilters({
            ...EMPTY_FILTERS,
            priorities: [3, 1, 3],
            assigneeIds: ["user-2", "user-1"],
            query: "  Match  ",
        });
        const right = normalizeBoardFilters({
            ...EMPTY_FILTERS,
            priorities: [1, 3],
            assigneeIds: ["user-1", "user-2"],
            query: "Match",
        });

        expect(serializeBoardFilters(left)).toBe(serializeBoardFilters(right));
    });
});
