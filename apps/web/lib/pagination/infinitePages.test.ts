import { describe, expect, test } from "bun:test";
import type { InfiniteData } from "@tanstack/react-query";
import type { CursorPage } from "@trymatcha/types";
import {
    flattenInfinitePages,
    removeInfinitePageItem,
    replaceInfinitePageItem,
    updateInfinitePageItem,
} from "./infinitePages";

type Item = {
    id: string;
    value: string;
};

const page = (items: Item[], nextCursor: string | null): CursorPage<Item> => ({
    items,
    nextCursor,
    hasMore: nextCursor !== null,
});

const data = (): InfiniteData<CursorPage<Item>, string | null> => ({
    pages: [
        page([{ id: "1", value: "first" }], "cursor-1"),
        page([{ id: "2", value: "middle" }], "cursor-2"),
        page([{ id: "3", value: "last" }], null),
    ],
    pageParams: [null, "cursor-1", "cursor-2"],
});

describe("infinite page helpers", () => {
    test("flattens chronological pages and deduplicates stable IDs", () => {
        const pages = [
            page(
                [
                    { id: "1", value: "first" },
                    { id: "2", value: "middle" },
                ],
                "cursor-1",
            ),
            page(
                [
                    { id: "2", value: "duplicate" },
                    { id: "3", value: "last" },
                ],
                null,
            ),
        ];

        expect(flattenInfinitePages(pages)).toEqual([
            { id: "1", value: "first" },
            { id: "2", value: "middle" },
            { id: "3", value: "last" },
        ]);
    });

    test.each(["1", "2", "3"])("updates item %s without changing cursor metadata", (id) => {
        const source = data();
        const result = updateInfinitePageItem(source, id, (item) => ({
            ...item,
            value: "updated",
        }));

        expect(flattenInfinitePages(result.pages).find((item) => item.id === id)?.value).toBe(
            "updated",
        );
        expect(result.pageParams).toBe(source.pageParams);
        expect(result.pages.map(({ nextCursor, hasMore }) => ({ nextCursor, hasMore }))).toEqual(
            source.pages.map(({ nextCursor, hasMore }) => ({ nextCursor, hasMore })),
        );
    });

    test("preserves the cache reference when an update is a no-op", () => {
        const source = data();

        expect(updateInfinitePageItem(source, "2", (item) => item)).toBe(source);
    });

    test.each(["1", "2", "3"])("removes item %s without changing cursor metadata", (id) => {
        const source = data();
        const result = removeInfinitePageItem(source, id);

        expect(flattenInfinitePages(result.pages).some((item) => item.id === id)).toBe(false);
        expect(result.pageParams).toBe(source.pageParams);
        expect(result.pages.map(({ nextCursor, hasMore }) => ({ nextCursor, hasMore }))).toEqual(
            source.pages.map(({ nextCursor, hasMore }) => ({ nextCursor, hasMore })),
        );
    });

    test.each(["1", "2", "3"])(
        "replaces optimistic item %s and removes a server-ID duplicate",
        (id) => {
            const source = data();
            source.pages[0] = {
                ...source.pages[0],
                items: [{ id: "server-id", value: "duplicate" }, ...source.pages[0].items],
            };

            const result = replaceInfinitePageItem(source, id, {
                id: "server-id",
                value: "confirmed",
            });
            const rows = flattenInfinitePages(result.pages);

            expect(rows.filter((item) => item.id === "server-id")).toEqual([
                { id: "server-id", value: "confirmed" },
            ]);
            expect(result.pageParams).toBe(source.pageParams);
            expect(
                result.pages.map(({ nextCursor, hasMore }) => ({ nextCursor, hasMore })),
            ).toEqual(source.pages.map(({ nextCursor, hasMore }) => ({ nextCursor, hasMore })));
        },
    );
});
