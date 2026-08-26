import { expect, test } from "bun:test";

import { verify_next_product_diff_fixtures } from "./script.verify_next_product_diff_fixtures";

test("verifies generated launch plans and categorizes the real missing provider import", async () => {
    const verified = await verify_next_product_diff_fixtures();

    expect(verified.ready).toEqual([
        expect.objectContaining({
            name: "next-standalone",
            applicationPath: ".",
            installDirectory: ".",
            healthPath: "/",
            command: "bun run dev -- --hostname 127.0.0.1 --port 41337",
        }),
        expect.objectContaining({
            name: "next-turborepo",
            applicationPath: "apps/marketing",
            installDirectory: ".",
            healthPath: "/",
            command: "bun run --cwd apps/marketing dev -- --hostname 127.0.0.1 --port 41337",
        }),
        expect.objectContaining({
            name: "next-nx",
            applicationPath: "apps/store",
            installDirectory: ".",
            healthPath: "/",
            command:
                "bun x --no-install nx run @matcha-fixture/store:serve -- --host=127.0.0.1 --port=41337",
        }),
    ]);
    expect(verified.providerFailure).toMatchObject({
        status: "PreviewUnavailable",
        hermetic: true,
        ancestorPoisoned: true,
        diagnostic: { code: "PREVIEW_SERVER_UNAVAILABLE", stage: "startup" },
    });
    expect(verified.installability).toEqual([
        expect.objectContaining({ name: "next-standalone", frozen: true }),
        expect.objectContaining({ name: "next-turborepo", frozen: true }),
        expect.objectContaining({ name: "next-nx", frozen: true }),
        expect.objectContaining({ name: "next-ambiguous-workspace", frozen: true }),
        expect.objectContaining({ name: "next-provider-failure", frozen: true }),
    ]);
    expect(verified.ready[2]).toMatchObject({
        name: "next-nx",
        buildTarget: "@matcha-fixture/store:build",
    });
    expect(verified.readyLaunch).toEqual([
        expect.objectContaining({ name: "next-standalone", ready: true }),
        expect.objectContaining({ name: "next-turborepo", ready: true }),
        expect.objectContaining({ name: "next-nx", ready: true }),
    ]);

    expect(verified.replay[0]).toEqual({
        name: "next-replay-standalone",
        workspaceKind: "Standalone",
        productionBuild: true,
        productionStart: true,
        interactionChangedDom: true,
        animationPresent: true,
        unexpectedRequests: [],
        credentialedRequestMetadata: false,
        workspacePackages: ["@matcha-fixture/next-replay-standalone"],
        layoutModes: ["inherit"],
        localWasm: false,
        wasmInitialized: false,
    });
    expect(verified.replay[1]).toEqual({
        name: "next-replay-turborepo",
        workspaceKind: "Turborepo",
        productionBuild: true,
        productionStart: true,
        interactionChangedDom: true,
        animationPresent: true,
        unexpectedRequests: [],
        credentialedRequestMetadata: false,
        workspacePackages: [
            "@matcha-fixture/next-replay-turborepo",
            "@matcha-fixture/replay-marketing",
            "@matcha-fixture/replay-ui",
        ],
        layoutModes: ["inherit"],
        localWasm: false,
        wasmInitialized: false,
    });
    expect(verified.replay[2]).toEqual({
        name: "next-replay-nx",
        workspaceKind: "Nx",
        productionBuild: true,
        productionStart: true,
        interactionChangedDom: true,
        animationPresent: true,
        unexpectedRequests: [],
        credentialedRequestMetadata: false,
        workspacePackages: ["@matcha-fixture/next-replay-nx"],
        layoutModes: ["inherit"],
        localWasm: false,
        wasmInitialized: false,
    });
    expect(verified.replay[3]).toEqual({
        name: "next-replay-provider-isolation",
        workspaceKind: "Standalone",
        productionBuild: true,
        productionStart: true,
        interactionChangedDom: true,
        animationPresent: true,
        unexpectedRequests: [],
        credentialedRequestMetadata: false,
        workspacePackages: ["@matcha-fixture/next-replay-provider-isolation"],
        layoutModes: ["inherit", "isolate"],
        localWasm: false,
        wasmInitialized: false,
    });
    expect(verified.replay[4]).toEqual({
        name: "next-replay-rive",
        workspaceKind: "Turborepo",
        productionBuild: true,
        productionStart: true,
        interactionChangedDom: true,
        animationPresent: true,
        unexpectedRequests: [],
        credentialedRequestMetadata: false,
        workspacePackages: ["@matcha-fixture/next-replay-rive", "@matcha-fixture/replay-rive-app"],
        layoutModes: ["inherit"],
        localWasm: true,
        wasmInitialized: true,
    });
    expect(verified.runtime).toEqual({
        protocolVersion: 11,
        chromiumAvailable: true,
        replayCommandAvailable: true,
    });
    expect(verified.multiApplicationReplay).toEqual({
        name: "next-replay-multi-app",
        applicationPaths: ["apps/admin", "apps/web"],
        buildCommands: ["bun run --cwd apps/admin build", "bun run --cwd apps/web build"],
        startCommands: [
            "bun run --cwd apps/admin next start --hostname 127.0.0.1 --port 41439",
            "bun run --cwd apps/web next start --hostname 127.0.0.1 --port 41439",
        ],
        revisionCoordinates: [
            "head:web:web-route",
            "head:admin:admin-route",
            "base:web:web-route",
            "base:admin:admin-route",
        ],
    });
}, 600_000);
