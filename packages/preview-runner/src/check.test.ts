import { afterEach, expect, mock, test } from "bun:test";
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
        first() {
            return this;
        },
    }),
};

mock.module("./browser", () => ({
    open_browser: async () => ({ close: async () => undefined }),
    open_deterministic_context: async () => ({
        newPage: async () => page,
        close: async () => undefined,
    }),
    settle_page: async () => undefined,
}));

const { check } = await import("./check");

test("rejects a target that logs a console error before capture", async () => {
    const root = fixture_root();

    const result = await check({
        baseUrl: "http://127.0.0.1:41337",
        routePath: "/preview-run-a",
        workspaceRoot: root,
        nextAppDir: "apps/web",
        navigationTimeoutMs: 10_000,
    });

    expect(result.ok).toBe(false);
    expect(result.results[1]).toMatchObject({ problem: "ConsoleError" });
});

test("rejects a redirect even when it returns to the expected preview route", async () => {
    consoleError = false;
    redirected = true;
    const root = fixture_root();

    const result = await check({
        baseUrl: "http://127.0.0.1:41337",
        routePath: "/preview-run-a",
        workspaceRoot: root,
        nextAppDir: "apps/web",
        navigationTimeoutMs: 10_000,
    });

    expect(result.ok).toBe(false);
    expect(result.results[1]).toMatchObject({ problem: "Redirected" });
});

afterEach(() => {
    consoleError = true;
    redirected = false;
    currentUrl = "";
    while (fixtureRoots.length) rmSync(fixtureRoots.pop()!, { recursive: true, force: true });
});
