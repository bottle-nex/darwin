import { type InfiniteData, QueryClient } from "@tanstack/react-query";
import type { CursorPage } from "@trymatcha/types";
import { describe, expect, test } from "bun:test";

import type { BoardIssue, BoardLaneSelector, BoardMetadata } from "@/types/board";

import {
    boardColumnsKey,
    boardLaneKey,
    boardLanePageLimit,
    boardOverlayKey,
    flattenBoardLanePages,
    mergeBoardLaneRows,
    patchBoardIssueCaches,
    patchBoardPageItem,
    pruneBoardOverlayRows,
    removeBoardPageItem,
} from "./boardCache";

const issue = (
    id: string,
    createdAt: string,
    customColumnId: string | null = null,
): BoardIssue => ({
    id,
    number: Number(id.replace(/\D/g, "")) || 1,
    title: `Issue ${id}`,
    description: "",
    priority: 3,
    status: "Todo",
    customColumnId,
    createdAt,
    startDate: null,
    targetDate: null,
    prUrl: null,
    prNumber: null,
    prTitle: null,
    creator: null,
    assignees: [],
    tags: [],
});

const page = (items: BoardIssue[], nextCursor: string | null): CursorPage<BoardIssue> => ({
    items,
    nextCursor,
    hasMore: nextCursor !== null,
    total: 4,
});

const pages = (): InfiniteData<CursorPage<BoardIssue>, string | null> => ({
    pages: [
        page(
            [issue("4", "2026-08-22T04:00:00.000Z"), issue("3", "2026-08-22T03:00:00.000Z")],
            "cursor-3",
        ),
        page(
            [issue("2", "2026-08-22T02:00:00.000Z"), issue("1", "2026-08-22T01:00:00.000Z")],
            null,
        ),
    ],
    pageParams: [null, "cursor-3"],
});

const todoLane: BoardLaneSelector = { type: "system", status: "Todo" };

describe("board page cache", () => {
    test("requests 30 issues initially and 20 issues on later pages", () => {
        expect(boardLanePageLimit(null)).toBe(30);
        expect(boardLanePageLimit("next-page")).toBe(20);
    });

    test("appends older API pages after the initial newest issues", () => {
        expect(flattenBoardLanePages(pages().pages).map((row) => row.id)).toEqual([
            "4",
            "3",
            "2",
            "1",
        ]);
    });

    test("deduplicates live overlays without changing server cursor metadata", () => {
        const source = pages();
        const rows = mergeBoardLaneRows(source.pages, todoLane, [
            issue("4", "2026-08-22T04:00:00.000Z"),
            issue("5", "2026-08-22T05:00:00.000Z"),
            issue("5", "2026-08-22T05:00:00.000Z"),
            issue("custom", "2026-08-22T06:00:00.000Z", "column-1"),
        ]);

        expect(rows.map((row) => row.id)).toEqual(["5", "4", "3", "2", "1"]);
        expect(source.pages.map((value) => value.nextCursor)).toEqual(["cursor-3", null]);
        expect(source.pageParams).toEqual([null, "cursor-3"]);
        expect(
            pruneBoardOverlayRows(
                [issue("4", "2026-08-22T04:00:00.000Z"), issue("5", "2026-08-22T05:00:00.000Z")],
                source.pages,
            ).map((row) => row.id),
        ).toEqual(["5"]);
        const untouched = [issue("5", "2026-08-22T05:00:00.000Z")];
        expect(pruneBoardOverlayRows(untouched, source.pages)).toBe(untouched);
    });

    test("patches and removes rows on any accumulated page without touching cursors", () => {
        const source = pages();
        const updated = patchBoardPageItem(source, issue("2", "2026-08-22T02:00:00.000Z"));
        const renamed = patchBoardPageItem(updated, {
            ...issue("2", "2026-08-22T02:00:00.000Z"),
            title: "Renamed",
        });
        const removed = removeBoardPageItem(renamed, "3");

        expect(flattenBoardLanePages(removed.pages).find((row) => row.id === "2")?.title).toBe(
            "Renamed",
        );
        expect(flattenBoardLanePages(removed.pages).some((row) => row.id === "3")).toBe(false);
        expect(removed.pages.map((value) => value.nextCursor)).toEqual(["cursor-3", null]);
        expect(removed.pageParams).toBe(source.pageParams);
    });

    test("patches one project without changing another project's lanes or totals", () => {
        const queryClient = new QueryClient();
        const metadata = (): BoardMetadata => ({
            chapters: [],
            columns: [],
            totals: { system: { Todo: 4 }, custom: {} },
        });
        queryClient.setQueryData(boardLaneKey("project-a", todoLane), pages());
        queryClient.setQueryData(boardLaneKey("project-b", todoLane), pages());
        queryClient.setQueryData(boardColumnsKey("project-a"), metadata());
        queryClient.setQueryData(boardColumnsKey("project-b"), metadata());

        patchBoardIssueCaches(queryClient, "project-a", issue("5", "2026-08-22T05:00:00.000Z"), {
            created: true,
        });

        expect(
            queryClient.getQueryData<BoardMetadata>(boardColumnsKey("project-a"))?.totals.system
                .Todo,
        ).toBe(5);
        expect(
            queryClient.getQueryData<BoardMetadata>(boardColumnsKey("project-b"))?.totals.system
                .Todo,
        ).toBe(4);
        expect(
            flattenBoardLanePages(
                queryClient.getQueryData<ReturnType<typeof pages>>(
                    boardLaneKey("project-b", todoLane),
                )!.pages,
            ).map((row) => row.id),
        ).toEqual(["4", "3", "2", "1"]);
    });

    test("ignores same-lane updates for issues outside every loaded cache", () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<BoardMetadata>(boardColumnsKey("project-a"), {
            chapters: [],
            columns: [],
            totals: { system: { Todo: 4 }, custom: {} },
        });

        patchBoardIssueCaches(queryClient, "project-a", issue("5", "2026-08-22T05:00:00.000Z"), {
            beforeLane: { type: "system", status: "Todo" },
        });

        expect(queryClient.getQueryData(boardOverlayKey("project-a"))).toBeUndefined();
        expect(
            queryClient.getQueryData<BoardMetadata>(boardColumnsKey("project-a"))?.totals.system
                .Todo,
        ).toBe(4);
    });

    test("reconciles an unloaded move through the overlay and server totals", () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<BoardMetadata>(boardColumnsKey("project-a"), {
            chapters: [],
            columns: [],
            totals: { system: { Todo: 4, Done: 2 }, custom: {} },
        });

        patchBoardIssueCaches(
            queryClient,
            "project-a",
            { ...issue("5", "2026-08-22T05:00:00.000Z"), status: "Done" },
            { beforeLane: { type: "system", status: "Todo" } },
        );

        expect(
            queryClient
                .getQueryData<BoardIssue[]>(boardOverlayKey("project-a"))
                ?.map((row) => row.id),
        ).toEqual(["5"]);
        expect(
            queryClient.getQueryData<BoardMetadata>(boardColumnsKey("project-a"))?.totals.system,
        ).toMatchObject({ Todo: 3, Done: 3 });
    });

    test("applies lane totals once when a mutation and socket confirm the same move", () => {
        const setup = () => {
            const queryClient = new QueryClient();
            queryClient.setQueryData(boardLaneKey("project-a", todoLane), pages());
            queryClient.setQueryData<BoardMetadata>(boardColumnsKey("project-a"), {
                chapters: [],
                columns: [],
                totals: { system: { Todo: 4, Done: 2 }, custom: {} },
            });
            return queryClient;
        };
        const moved = { ...issue("4", "2026-08-22T04:00:00.000Z"), status: "Done" as const };
        const previousLane = { type: "system", status: "Todo" } as const;

        const responseFirst = setup();
        patchBoardIssueCaches(responseFirst, "project-a", moved);
        patchBoardIssueCaches(responseFirst, "project-a", moved, { beforeLane: previousLane });

        const socketFirst = setup();
        patchBoardIssueCaches(socketFirst, "project-a", moved, { beforeLane: previousLane });
        patchBoardIssueCaches(socketFirst, "project-a", moved);

        expect(
            responseFirst.getQueryData<BoardMetadata>(boardColumnsKey("project-a"))?.totals.system,
        ).toMatchObject({ Todo: 3, Done: 3 });
        expect(
            socketFirst.getQueryData<BoardMetadata>(boardColumnsKey("project-a"))?.totals.system,
        ).toMatchObject({ Todo: 3, Done: 3 });
    });
});
