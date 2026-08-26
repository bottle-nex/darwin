import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, mock, test } from "bun:test";
import type { Sandbox } from "e2b";

import { collect_next_replay_assets } from "./service.next_replay_assets";

test("collects every regular static and public browser asset with normalized request paths", async () => {
    const run = mock().mockResolvedValue({
        exitCode: 0,
        stdout: [
            "/workspace/apps/web/.next/static/chunks/app.js",
            "/workspace/apps/web/.next/static/chunks/lazy.js",
            "/workspace/apps/web/public/images/logo.svg",
            "",
        ].join("\0"),
        stderr: "",
    });
    const sandbox = { commands: { run } } as unknown as Sandbox;

    const assets = await collect_next_replay_assets(sandbox, "/workspace/apps/web");

    expect(assets).toEqual([
        {
            requestPath: "/_next/static/chunks/app.js",
            sourcePath: "/workspace/apps/web/.next/static/chunks/app.js",
            contentType: "application/javascript",
        },
        {
            requestPath: "/_next/static/chunks/lazy.js",
            sourcePath: "/workspace/apps/web/.next/static/chunks/lazy.js",
            contentType: "application/javascript",
        },
        {
            requestPath: "/images/logo.svg",
            sourcePath: "/workspace/apps/web/public/images/logo.svg",
            contentType: "image/svg+xml",
        },
    ]);
});

test("rejects reported files outside the application browser asset roots", async () => {
    const run = mock().mockResolvedValue({
        exitCode: 0,
        stdout: [
            "/workspace/apps/web/.next/static/chunks/app.js",
            "/workspace/apps/web/.next/server/app.js",
            "/workspace/apps/other/public/secret.js",
            "",
        ].join("\0"),
        stderr: "",
    });
    const sandbox = { commands: { run } } as unknown as Sandbox;

    const assets = await collect_next_replay_assets(sandbox, "/workspace/apps/web");

    expect(assets.map((asset) => asset.requestPath)).toEqual(["/_next/static/chunks/app.js"]);
});

test("does not follow file or directory symlinks while collecting browser assets", async () => {
    const root = await mkdtemp(join(tmpdir(), "matcha-replay-assets-"));
    const applicationRoot = join(root, "app");
    const staticChunks = join(applicationRoot, ".next/static/chunks");
    const publicRoot = join(applicationRoot, "public");
    const outsideRoot = join(root, "outside");
    await mkdir(staticChunks, { recursive: true });
    await mkdir(publicRoot, { recursive: true });
    await mkdir(outsideRoot, { recursive: true });
    await writeFile(join(staticChunks, "inside.js"), "inside");
    await writeFile(join(outsideRoot, "outside.js"), "outside");
    await symlink(join(outsideRoot, "outside.js"), join(staticChunks, "linked.js"));
    await symlink(outsideRoot, join(publicRoot, "linked-directory"));
    const sandbox = {
        commands: {
            run: async (command: string) => {
                const process = Bun.spawn(["bash", "-lc", command], {
                    stdout: "pipe",
                    stderr: "pipe",
                });
                const [stdout, stderr, exitCode] = await Promise.all([
                    new Response(process.stdout).text(),
                    new Response(process.stderr).text(),
                    process.exited,
                ]);
                return { stdout, stderr, exitCode };
            },
        },
    } as unknown as Sandbox;

    try {
        const assets = await collect_next_replay_assets(sandbox, applicationRoot);

        expect(assets.map((asset) => asset.requestPath)).toEqual([
            "/_next/static/chunks/inside.js",
        ]);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
