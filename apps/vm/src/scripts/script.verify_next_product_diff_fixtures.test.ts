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
            command:
                "bun run --filter @matcha-fixture/marketing dev -- --hostname 127.0.0.1 --port 41337",
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
}, 120_000);
