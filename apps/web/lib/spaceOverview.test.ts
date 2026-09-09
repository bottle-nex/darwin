import { describe, expect, it } from "bun:test";

import { spaceProgressFor } from "./spaceOverview";

const columns = [
    { id: "a", spaceId: "space-1", label: "Doing", order: 0 },
    { id: "b", spaceId: "space-1", label: "Shipped", order: 1 },
    { id: "c", spaceId: "space-2", label: "Elsewhere", order: 0 },
];

const totals = {
    system: {},
    custom: { a: 3, b: 5, c: 9 },
    done: { a: 1, b: 5, c: 9 },
};

describe("spaceProgressFor", () => {
    it("sums only the columns the space owns", () => {
        const progress = spaceProgressFor("space-1", columns, totals);
        expect(progress.columns.map((column) => column.id)).toEqual(["a", "b"]);
        expect(progress.scope).toBe(8);
        expect(progress.completed).toBe(6);
        expect(progress.percent).toBe(75);
    });

    it("reports zero rather than dividing by an empty scope", () => {
        expect(spaceProgressFor("space-3", columns, totals)).toEqual({
            columns: [],
            scope: 0,
            completed: 0,
            percent: 0,
        });
    });

    it("treats a column missing from totals as empty", () => {
        const progress = spaceProgressFor("space-1", columns, undefined);
        expect(progress.scope).toBe(0);
        expect(progress.columns).toHaveLength(2);
    });
});
