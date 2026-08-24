import { expect, test } from "bun:test";
import type { Sandbox } from "e2b";

import PreviewRunner from "./service.preview_runner";

function sandbox_with_runtime_version(version: number): Sandbox {
    return {
        commands: {
            run: async () => ({
                exitCode: 0,
                stdout: JSON.stringify({ version }),
            }),
        },
    } as unknown as Sandbox;
}

test("accepts the current preview-runner protocol and rejects an older snapshot", async () => {
    expect(await PreviewRunner.supports_current_protocol(sandbox_with_runtime_version(6))).toBe(
        true,
    );
    expect(await PreviewRunner.supports_current_protocol(sandbox_with_runtime_version(5))).toBe(
        false,
    );
});

test("sends a VM-provided job-scoped surface request to the sandbox runner", async () => {
    let request: unknown = null;
    let command = "";
    const sandbox = {
        files: {
            write: async (_path: string, contents: string) => {
                request = JSON.parse(contents);
            },
            read: async () =>
                JSON.stringify({
                    routePath: "/preview-run-a",
                    generatedFiles: ["/workspace/apps/web/app/preview-run-a/[targetId]/page.tsx"],
                    router: "AppRouter",
                }),
        },
        commands: {
            run: async (value: string) => {
                command = value;
                return { exitCode: 0, stdout: "" };
            },
        },
    } as unknown as Sandbox;

    const surface = await PreviewRunner.create_next_preview_surface(sandbox, {
        workspaceRoot: "/workspace",
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
    });

    expect(command).toContain("create-next-preview-surface");
    expect(request).toEqual({
        workspaceRoot: "/workspace",
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
    });
    expect(surface.routePath).toBe("/preview-run-a");
});

test("preserves the truncation sentinel when normalizing harness warnings", async () => {
    const sandbox = {
        files: {
            read: async () =>
                JSON.stringify({
                    targets: [
                        {
                            id: "header-nav",
                            label: "Header navigation",
                            sourcePath: "components/HeaderNav.tsx",
                            states: [{ id: "default", label: "Default" }],
                        },
                    ],
                    warnings: Array.from({ length: 21 }, (_, index) => `warning-${index}`),
                }),
        },
    } as unknown as Sandbox;

    const manifest = await PreviewRunner.read_manifest(sandbox, "/workspace/apps/web");

    expect(manifest.warnings).toHaveLength(20);
    expect(manifest.warnings.at(-1)).toBe("advisory warnings were truncated to fit preview limits");
    expect(manifest.warnings).toContain("warning-18");
    expect(manifest.warnings).not.toContain("warning-19");
});
