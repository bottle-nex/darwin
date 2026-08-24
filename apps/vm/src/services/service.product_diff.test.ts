import { expect, test } from "bun:test";

import {
    product_diff_failure_status,
    preview_check_error,
    preview_unavailable_diagnostic,
} from "./service.product_diff";

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

test("does not persist browser-check credentials in PreviewUnavailable diagnostics", () => {
    const diagnostic = preview_unavailable_diagnostic(
        "verify the head preview surface",
        "ConsoleError: Bearer browser-secret https://preview.example/?access_token=query-secret",
        "apps/web",
    );

    expect(diagnostic.message).toContain("Bearer [redacted]");
    expect(diagnostic.message).toContain("access_token=[redacted]");
    expect(diagnostic.message).not.toContain("browser-secret");
    expect(diagnostic.message).not.toContain("query-secret");
});
