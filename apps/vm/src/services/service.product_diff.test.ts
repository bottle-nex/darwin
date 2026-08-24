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

test("does not persist sensitive browser-check detail in PreviewUnavailable diagnostics", () => {
    const checkError = preview_check_error("head", {
        targetId: "header-nav",
        stateId: "signed-out",
        problem: "ConsoleError",
        detail: 'https://preview.example/?client_secret=client-secret&refresh_token=refresh-secret Cookie: session=browser-cookie <div data-token="markup-secret">Preview denied</div>',
    });
    const diagnostic = preview_unavailable_diagnostic(
        "verify the head preview surface",
        checkError.message,
        "apps/web",
    );

    expect(diagnostic.message).toContain("client_secret=[redacted]");
    expect(diagnostic.message).toContain("refresh_token=[redacted]");
    expect(diagnostic.message).toContain("Cookie: [redacted]");
    expect(diagnostic.message).toContain("[HTML response omitted]");
    expect(diagnostic.message).not.toContain("client-secret");
    expect(diagnostic.message).not.toContain("refresh-secret");
    expect(diagnostic.message).not.toContain("browser-cookie");
    expect(diagnostic.message).not.toContain("markup-secret");
});
