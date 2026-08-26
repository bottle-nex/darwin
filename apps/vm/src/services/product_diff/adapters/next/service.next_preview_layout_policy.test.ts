import { expect, test } from "bun:test";

import NextPreviewLayoutPolicy from "./service.next_preview_layout_policy";

test("uses isolation before inheritance for an unconfigured App Router application", () => {
    expect(NextPreviewLayoutPolicy.attempt_modes("AppRouter", null)).toEqual([
        "isolate",
        "inherit",
    ]);
});

test("uses inherited layout only for an unconfigured Pages Router application", () => {
    expect(NextPreviewLayoutPolicy.attempt_modes("PagesRouter", null)).toEqual(["inherit"]);
});

test("uses an owner-configured mode without fallback", () => {
    expect(NextPreviewLayoutPolicy.attempt_modes("AppRouter", "inherit")).toEqual(["inherit"]);
    expect(NextPreviewLayoutPolicy.attempt_modes("AppRouter", "isolate")).toEqual(["isolate"]);
});
