import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const fixtureRoots: string[] = [];

function fixture_root(): string {
    const root = mkdtempSync(join(tmpdir(), "matcha-browser-check-"));
    fixtureRoots.push(root);
    const harnessDirectory = join(root, "apps", "web", "matcha_preview");
    mkdirSync(harnessDirectory, { recursive: true });
    writeFileSync(
        join(harnessDirectory, "manifest.json"),
        JSON.stringify({
            targets: [
                {
                    id: "failing-target",
                    label: "Failing target",
                    sourcePath: "components/FailingTarget.tsx",
                    states: [{ id: "default", label: "Default" }],
                },
            ],
            warnings: [],
        }),
    );
    return root;
}

let consoleError = true;
let redirected = false;
let redirectDuringSettle = false;
let currentUrl = "";

const page = {
    on(event: string, listener: (value: { type: () => string; text: () => string }) => void) {
        if (event === "console" && consoleError) {
            listener({ type: () => "error", text: () => "target failure" });
        }
    },
    goto: async (url: string) => {
        currentUrl = url;
        return {
            status: () => 200,
            request: () => ({
                redirectedFrom: () => (redirected ? {} : null),
            }),
        };
    },
    url: () => currentUrl,
    content: async () => "",
    locator: () => ({
        count: async () => 1,
        evaluate: async () => "",
        boundingBox: async () => ({ width: 400, height: 200 }),
        locator: () => ({
            count: async () => 0,
            evaluate: async () => "",
        }),
        first() {
            return this;
        },
    }),
};

const test_browser_runtime = {
    open_browser: async () => ({ close: async () => undefined }),
    open_deterministic_context: async () => ({
        newPage: async () => page,
        close: async () => undefined,
    }),
    settle_page: async () => {
        if (redirectDuringSettle) currentUrl = "http://127.0.0.1:41337/sign-in";
    },
};

const { check, next_error_overlay_detail } = await import("./check");

function next_portal(hasErrorOverlay: boolean, detail: string) {
    const errorOverlay = {
        count: async () => (hasErrorOverlay ? 1 : 0),
        evaluate: async () => detail,
    };
    return {
        evaluate: async () => detail,
        locator: () => errorOverlay,
    };
}

test("ignores the Next development-tools issue indicator", async () => {
    const detail = await next_error_overlay_detail(next_portal(false, "0\n1\nIssue") as never);

    expect(detail).toBe("");
});

test("reports text from a real Next error overlay", async () => {
    const detail = await next_error_overlay_detail(
        next_portal(true, "TypeError: missing provider") as never,
    );

    expect(detail).toBe("TypeError: missing provider");
});

test("rejects a target that logs a console error before capture", async () => {
    const root = fixture_root();

    const result = await check(
        {
            baseUrl: "http://127.0.0.1:41337",
            routePath: "/preview-run-a",
            workspaceRoot: root,
            nextAppDir: "apps/web",
            navigationTimeoutMs: 10_000,
        },
        test_browser_runtime as never,
    );

    expect(result.ok).toBe(false);
    expect(result.results[1]).toMatchObject({ problem: "ConsoleError" });
});

test("rejects a redirect even when it returns to the expected preview route", async () => {
    consoleError = false;
    redirected = true;
    const root = fixture_root();

    const result = await check(
        {
            baseUrl: "http://127.0.0.1:41337",
            routePath: "/preview-run-a",
            workspaceRoot: root,
            nextAppDir: "apps/web",
            navigationTimeoutMs: 10_000,
        },
        test_browser_runtime as never,
    );

    expect(result.ok).toBe(false);
    expect(result.results[1]).toMatchObject({ problem: "Redirected" });
});

test("rejects a client-side redirect that occurs while the page settles", async () => {
    consoleError = false;
    redirectDuringSettle = true;
    const root = fixture_root();

    const result = await check(
        {
            baseUrl: "http://127.0.0.1:41337",
            routePath: "/preview-run-a",
            workspaceRoot: root,
            nextAppDir: "apps/web",
            navigationTimeoutMs: 10_000,
        },
        test_browser_runtime as never,
    );

    expect(result.ok).toBe(false);
    expect(result.results[1]).toMatchObject({ problem: "Redirected" });
});

afterEach(() => {
    consoleError = true;
    redirected = false;
    redirectDuringSettle = false;
    currentUrl = "";
    while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});
