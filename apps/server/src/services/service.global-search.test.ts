import { describe, expect, test } from "bun:test";
import GlobalSearchController from "../controllers/search/controller.global_search";
import { escape_like } from "./service.board-issues";
import {
    build_snippet,
    contains_query,
    issue_display_text,
    keep_issue_hit,
    keep_message_hit,
    parse_issue_number,
    sender_name,
} from "./service.global-search";

const SNIPPET_MAX = 140 + 2;

describe("parse_issue_number", () => {
    test("accepts a bare or hash-prefixed integer", () => {
        expect(parse_issue_number("123")).toBe(123);
        expect(parse_issue_number("#123")).toBe(123);
        expect(parse_issue_number("0")).toBe(0);
    });

    test("rejects anything that is not exactly an issue number", () => {
        for (const query of ["12abc", "abc12", "#", "", "-1", "1.5", "12 ", "1234567890", "##1"]) {
            expect(parse_issue_number(query)).toBeNull();
        }
    });
});

describe("escape_like", () => {
    test("escapes every wildcard the ILIKE patterns rely on", () => {
        expect(escape_like("50%")).toBe("50\\%");
        expect(escape_like("a_b")).toBe("a\\_b");
        expect(escape_like("c:\\x")).toBe("c:\\\\x");
        expect(escape_like("%_\\")).toBe("\\%\\_\\\\");
    });

    test("leaves ordinary text untouched", () => {
        expect(escape_like("oauth callback")).toBe("oauth callback");
        expect(escape_like("#42")).toBe("#42");
    });
});

describe("issue_display_text", () => {
    test("strips tags and keeps the readable text", () => {
        expect(issue_display_text("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
    });

    test("collapses whitespace across nested markup", () => {
        expect(issue_display_text("<div>\n  <p>a</p>\n  <p>  b  </p>\n</div>")).toBe("a b");
    });

    test("drops mention tokens rather than leaking them", () => {
        const html =
            '<p>ping <span data-type="mention" data-kind="member" data-id="cm1" class="reference-chip">@[member:cm1]</span> now</p>';
        const text = issue_display_text(html);
        expect(text).not.toContain("@[member:");
        expect(text).not.toContain("cm1");
        expect(text).toContain("ping");
        expect(text).toContain("now");
    });

    test("handles an empty description", () => {
        expect(issue_display_text("")).toBe("");
    });
});

describe("build_snippet", () => {
    const long = `${"a".repeat(200)}needle${"b".repeat(200)}`;

    test("omits the leading ellipsis when the match is at the start", () => {
        expect(build_snippet("needle then more text", "needle")).toBe("needle then more text");
    });

    test("brackets a mid-text match with both ellipses", () => {
        const snippet = build_snippet(long, "needle");
        expect(snippet.startsWith("…")).toBe(true);
        expect(snippet.endsWith("…")).toBe(true);
        expect(snippet).toContain("needle");
    });

    test("omits the trailing ellipsis when the window reaches the end", () => {
        const text = `${"a".repeat(60)}needle`;
        const snippet = build_snippet(text, "needle");
        expect(snippet.startsWith("…")).toBe(true);
        expect(snippet.endsWith("…")).toBe(false);
        expect(snippet.endsWith("needle")).toBe(true);
    });

    test("adds no ellipsis when the whole text fits", () => {
        expect(build_snippet("short text", "text")).toBe("short text");
    });

    test("matches case insensitively", () => {
        expect(build_snippet(long, "NEEDLE")).toContain("needle");
    });

    test("falls back to the head of the text when the query is absent", () => {
        const snippet = build_snippet(long, "absent");
        expect(snippet.startsWith("a")).toBe(true);
        expect(snippet.endsWith("…")).toBe(true);
    });

    test("never exceeds the window plus both ellipses", () => {
        for (const query of ["needle", "absent", "NEEDLE"]) {
            expect(build_snippet(long, query).length).toBeLessThanOrEqual(SNIPPET_MAX);
        }
    });
});

describe("keep_issue_hit", () => {
    test("keeps number and title matches regardless of the description", () => {
        for (const rank of [0, 1, 2]) {
            expect(keep_issue_hit({ rank, matchedReference: false }, "unrelated", "widget")).toBe(
                true,
            );
        }
    });

    test("keeps a description match when the plain text really contains the query", () => {
        expect(
            keep_issue_hit({ rank: 3, matchedReference: false }, "about the widget", "widget"),
        ).toBe(true);
    });

    test("drops a description match that only hit the raw HTML", () => {
        expect(keep_issue_hit({ rank: 3, matchedReference: false }, "hello", "span")).toBe(false);
    });

    test("keeps a description match that came from a mention reference", () => {
        expect(keep_issue_hit({ rank: 3, matchedReference: true }, "hello", "Aarav")).toBe(true);
    });

    test("compares case insensitively", () => {
        expect(keep_issue_hit({ rank: 3, matchedReference: false }, "The Widget", "widget")).toBe(
            true,
        );
    });
});

describe("keep_message_hit", () => {
    test("keeps a message whose visible text contains the query", () => {
        expect(keep_message_hit({ matchedReference: false }, "ship the widget", "widget")).toBe(
            true,
        );
    });

    test("drops a message that only matched an opaque token id", () => {
        expect(keep_message_hit({ matchedReference: false }, "@Aarav Mehta", "cm1")).toBe(false);
    });

    test("keeps a reference match even when the label differs from the query", () => {
        expect(keep_message_hit({ matchedReference: true }, "@Aarav Mehta", "aarav@x.dev")).toBe(
            true,
        );
    });
});

describe("contains_query", () => {
    test("is case insensitive", () => {
        expect(contains_query("OAuth Callback", "oauth")).toBe(true);
        expect(contains_query("oauth callback", "OAUTH")).toBe(true);
        expect(contains_query("oauth callback", "webhook")).toBe(false);
    });
});

describe("sender_name", () => {
    test("prefers the name, falls back to email, then null", () => {
        expect(sender_name({ name: "Tim Apple", email: "tim@apple.com" })).toBe("Tim Apple");
        expect(sender_name({ name: null, email: "tim@apple.com" })).toBe("tim@apple.com");
        expect(sender_name(null)).toBeNull();
    });
});

describe("GlobalSearchController.query_schema", () => {
    test("trims the query", () => {
        expect(GlobalSearchController.query_schema.parse({ q: "  widget  " })).toEqual({
            q: "widget",
        });
    });

    test("rejects a query past the maximum length", () => {
        expect(GlobalSearchController.query_schema.safeParse({ q: "x".repeat(201) }).success).toBe(
            false,
        );
        expect(GlobalSearchController.query_schema.safeParse({ q: "x".repeat(200) }).success).toBe(
            true,
        );
    });

    test("rejects a missing query", () => {
        expect(GlobalSearchController.query_schema.safeParse({}).success).toBe(false);
    });
});
