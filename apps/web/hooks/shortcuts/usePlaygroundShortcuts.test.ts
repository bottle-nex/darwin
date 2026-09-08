import { describe, expect, it } from "bun:test";

import { resolveIssueTargets } from "./usePlaygroundShortcuts";

describe("resolveIssueTargets", () => {
    it("prefers the selection over hover and the open issue", () => {
        expect(resolveIssueTargets(["one", "two"], "hovered", "open")).toEqual(["one", "two"]);
    });

    it("falls back to hover, then to the open issue", () => {
        expect(resolveIssueTargets([], "hovered", "open")).toEqual(["hovered"]);
        expect(resolveIssueTargets([], null, "open")).toEqual(["open"]);
    });

    it("has no target when nothing is selected, hovered, or open", () => {
        expect(resolveIssueTargets([], null, null)).toEqual([]);
    });
});
