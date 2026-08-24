import { describe, expect, test } from "bun:test";

import PaginationService from "./service.pagination";

describe("PaginationService", () => {
    test("builds a tuple predicate without depending on the cursor row", () => {
        const createdAt = new Date("2026-08-22T12:34:56.789Z");

        expect(PaginationService.older_than_cursor({ createdAt, id: "deleted_issue" })).toEqual({
            OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: "deleted_issue" } }],
        });
    });
});
