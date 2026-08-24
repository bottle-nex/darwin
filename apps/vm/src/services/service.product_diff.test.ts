import { expect, test } from "bun:test";

import { product_diff_failure_status, preview_check_error } from "./service.product_diff";

test("maps preview startup and browser-validation failures to PreviewUnavailable", () => {
    expect(product_diff_failure_status("start head dev server")).toBe("PreviewUnavailable");
    expect(product_diff_failure_status("verify the base preview surface")).toBe(
        "PreviewUnavailable",
    );
    expect(product_diff_failure_status("run the harness agent")).toBe("Failed");
});

test("includes the failed browser-check detail in the persisted preview error", () => {
    const error = preview_check_error("head", {
        targetId: "header-nav",
        stateId: "signed-out",
        problem: "ConsoleError",
        detail: "Missing preview provider",
    });

    expect(error.message).toContain("Missing preview provider");
});
