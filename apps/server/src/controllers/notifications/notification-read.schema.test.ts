import { describe, expect, test } from "bun:test";
import { notification_read_body_schema } from "./notification-read.schema";

const accepts = (body: unknown) => notification_read_body_schema.safeParse(body).success;

describe("notification_read_body_schema", () => {
    test("accepts every valid scoped shape", () => {
        expect(accepts({ scope: "member" })).toBe(true);
        expect(accepts({ scope: "member", ids: ["n1"] })).toBe(true);
        expect(accepts({ scope: "project", projectId: "p1" })).toBe(true);
        expect(accepts({ scope: "project", projectId: "p1", ids: ["n1", "n2"] })).toBe(true);
    });

    test("rejects the old unscoped wire formats", () => {
        expect(accepts({})).toBe(false);
        expect(accepts({ ids: ["n1"] })).toBe(false);
    });

    test("requires projectId for the project scope", () => {
        expect(accepts({ scope: "project" })).toBe(false);
        expect(accepts({ scope: "project", projectId: "" })).toBe(false);
    });

    test("forbids projectId on the member scope", () => {
        expect(accepts({ scope: "member", projectId: "p1" })).toBe(false);
    });

    test("rejects an unknown scope", () => {
        expect(accepts({ scope: "everything" })).toBe(false);
    });

    test("bounds the ids array", () => {
        expect(accepts({ scope: "member", ids: [] })).toBe(false);
        expect(accepts({ scope: "member", ids: [""] })).toBe(false);
        expect(
            accepts({ scope: "member", ids: Array.from({ length: 100 }, (_, i) => `n${i}`) }),
        ).toBe(true);
        expect(
            accepts({ scope: "member", ids: Array.from({ length: 101 }, (_, i) => `n${i}`) }),
        ).toBe(false);
    });
});
