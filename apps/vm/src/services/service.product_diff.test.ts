import { expect, test } from "bun:test";

import {
    product_diff_failure_status,
    preview_check_error,
    preview_unavailable_error_message,
    preview_unavailable_diagnostic,
} from "./service.product_diff";

test("maps preview startup and browser-validation failures to PreviewUnavailable", () => {
    expect(product_diff_failure_status("start head dev server")).toBe("PreviewUnavailable");
    expect(product_diff_failure_status("verify the base preview surface")).toBe(
        "PreviewUnavailable",
    );
    expect(product_diff_failure_status("run the harness agent")).toBe("Failed");
});

test("uses only structured browser-check fields in persisted preview errors", () => {
    const error = preview_check_error(
        "head",
        {
            targetId: "header-nav",
            stateId: "signed-out",
            problem: "ConsoleError",
            detail: "Missing preview provider",
            httpStatus: 503,
        },
        "/preview-run-a",
    );

    expect(error.message).toContain("target=header-nav");
    expect(error.message).toContain("state=signed-out");
    expect(error.message).toContain("problem=ConsoleError");
    expect(error.message).toContain("httpStatus=503");
    expect(error.message).toContain("route=/preview-run-a");
    expect(error.message).not.toContain("Missing preview provider");
});

test("does not persist JSON headers or control-separated browser detail", () => {
    const checkError = preview_check_error(
        "head",
        {
            targetId: "header-nav",
            stateId: "signed-out",
            problem: "ConsoleError",
            detail: '{"Authorization":"Bearer json-secret","Cookie":"session=json-cookie"}\u001eaccess_token=control-secret',
            httpStatus: 401,
        },
        "/preview-run-a",
    );
    const diagnostic = preview_unavailable_diagnostic(
        "verify the head preview surface",
        checkError.message,
        "apps/web",
    );

    expect(diagnostic.message).toContain("target=header-nav");
    expect(diagnostic.message).toContain("state=signed-out");
    expect(diagnostic.message).toContain("problem=ConsoleError");
    expect(diagnostic.message).toContain("httpStatus=401");
    expect(diagnostic.message).toContain("route=/preview-run-a");
    expect(diagnostic.message).not.toContain("json-secret");
    expect(diagnostic.message).not.toContain("json-cookie");
    expect(diagnostic.message).not.toContain("control-secret");
    expect(diagnostic.message).not.toContain("Authorization");
    expect(diagnostic.message).not.toContain("Cookie");
});

test("uses a static persisted error for unstructured preview failures", () => {
    const message = preview_unavailable_error_message(
        "verify the head preview surface",
        new Error(
            '{"Authorization":"Bearer fallback-secret","Cookie":"session=fallback-cookie"}\u001efallback-control-secret',
        ),
    );

    expect(message).toBe("Preview unavailable during verify the head preview surface.");
    expect(message).not.toContain("fallback-secret");
    expect(message).not.toContain("fallback-cookie");
    expect(message).not.toContain("fallback-control-secret");
});

test("drops invalid structured field values from persisted preview errors", () => {
    const error = preview_check_error(
        "base",
        {
            targetId: "target-\u001eidentifier-secret",
            stateId: "state-\u001estate-secret",
            problem: "ConsoleError\u001eproblem-secret",
            detail: "detail-secret",
            httpStatus: 700,
        },
        "/preview-run-a\u001eroute-secret",
    );

    expect(error.message).toContain("revision=base");
    expect(error.message).toContain("target=unknown");
    expect(error.message).toContain("state=unknown");
    expect(error.message).toContain("problem=Unknown");
    expect(error.message).toContain("route=/unknown");
    expect(error.message).not.toContain("httpStatus=");
    expect(error.message).not.toContain("identifier-secret");
    expect(error.message).not.toContain("state-secret");
    expect(error.message).not.toContain("problem-secret");
    expect(error.message).not.toContain("detail-secret");
    expect(error.message).not.toContain("route-secret");
});
