import { expect, test } from "bun:test";

import { content_type, resolve_within } from "./server";

test("content types cover what a vite build emits", () => {
    expect(content_type("/faq/index.html")).toBe("text/html; charset=utf-8");
    expect(content_type("/assets/main.js")).toBe("text/javascript; charset=utf-8");
    expect(content_type("/assets/main.css")).toBe("text/css; charset=utf-8");
    expect(content_type("/assets/inter.woff2")).toBe("font/woff2");
});

test("an unknown extension is served as bytes rather than guessed", () => {
    expect(content_type("/assets/data.bin")).toBe("application/octet-stream");
});

test("a path inside the served directory resolves", () => {
    expect(resolve_within("/dist", "/faq-item/index.html")).toBe("/dist/faq-item/index.html");
});

test("leading dot segments are clamped inside the served directory", () => {
    expect(resolve_within("/dist", "/../secrets.env")).toBe("/dist/secrets.env");
    expect(resolve_within("/dist", "/faq/../../secrets.env")).toBe("/dist/secrets.env");
    expect(resolve_within("/dist", "/%2e%2e/%2e%2e/secrets.env")).toBe("/dist/secrets.env");
});

test("a relative path that climbs out of the served directory is refused", () => {
    expect(resolve_within("/dist", "../secrets.env")).toBe(null);
    expect(resolve_within("/dist", "../dist-other/index.html")).toBe(null);
});

test("a query string is not part of the file path", () => {
    expect(resolve_within("/dist", "/faq-item/index.html?variant=ghost")).toBe(
        "/dist/faq-item/index.html",
    );
});
