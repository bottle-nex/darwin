import { expect, test } from "bun:test";

import { sanitize_preview_diagnostic_message } from "./service.preview_diagnostic_sanitizer";

test("redacts credential query values and bearer-style credentials", () => {
    const message = sanitize_preview_diagnostic_message(
        "ConsoleError: fetch https://preview.example/render?token=token-secret&password=hunter2 Bearer bearer-secret api-key: api-secret",
    );

    expect(message).toContain("token=[redacted]");
    expect(message).toContain("password=[redacted]");
    expect(message).toContain("Bearer [redacted]");
    expect(message).toContain("api-key: [redacted]");
    expect(message).not.toContain("token-secret");
    expect(message).not.toContain("hunter2");
    expect(message).not.toContain("bearer-secret");
    expect(message).not.toContain("api-secret");
});

test("omits raw HTML response bodies from diagnostics", () => {
    const message = sanitize_preview_diagnostic_message(
        "HTTP 500\n<html><body><input value=unmarked-secret /></body></html>",
    );

    expect(message).toContain("HTTP 500");
    expect(message).toContain("[HTML response omitted]");
    expect(message).not.toContain("unmarked-secret");
    expect(message).not.toContain("<html>");
});

test("redacts authorization values after non-bearer schemes", () => {
    const message = sanitize_preview_diagnostic_message(
        "PageError: Authorization: Basic basic-secret",
    );

    expect(message).toContain("Authorization: [redacted]");
    expect(message).not.toContain("basic-secret");
});

test("redacts compound credential labels in query strings and labelled output", () => {
    const message = sanitize_preview_diagnostic_message(
        "ConsoleError: https://preview.example/?client_secret=client-secret&refresh_token=refresh-secret&cookies=query-cookie client_secret: labelled-client refresh_token=labelled-refresh Cookie: session=labelled-cookie data-secret: compound-secret",
    );

    expect(message).toContain("client_secret=[redacted]");
    expect(message).toContain("refresh_token=[redacted]");
    expect(message).toContain("cookies=[redacted]");
    expect(message).toContain("Cookie: [redacted]");
    expect(message).toContain("data-secret: [redacted]");
    expect(message).not.toContain("client-secret");
    expect(message).not.toContain("refresh-secret");
    expect(message).not.toContain("query-cookie");
    expect(message).not.toContain("labelled-client");
    expect(message).not.toContain("labelled-refresh");
    expect(message).not.toContain("labelled-cookie");
    expect(message).not.toContain("compound-secret");
});

test("omits arbitrary markup fragments from diagnostics", () => {
    const message = sanitize_preview_diagnostic_message(
        'HTTP 403 <div data-token="markup-secret">Preview denied</div>',
    );

    expect(message).toContain("HTTP 403");
    expect(message).toContain("[HTML response omitted]");
    expect(message).not.toContain("markup-secret");
    expect(message).not.toContain("<div");
});
