import { expect, test } from "bun:test";

import { verify_next_product_diff_fixtures } from "./script.verify_next_product_diff_fixtures";

test("verifies generated launch plans and categorizes the real missing provider import", () => {
    const verified = verify_next_product_diff_fixtures();

    expect(verified.ready).toEqual([
        expect.objectContaining({
            name: "next-standalone",
            applicationPath: ".",
            installDirectory: ".",
            healthPath: "/",
            command: "npm run dev -- --hostname 127.0.0.1 --port 41337",
        }),
        expect.objectContaining({
            name: "next-turborepo",
            applicationPath: "apps/marketing",
            installDirectory: ".",
            healthPath: "/",
            command:
                "pnpm --filter @matcha-fixture/marketing run dev -- --hostname 127.0.0.1 --port 41337",
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
        diagnostic: { code: "PREVIEW_SERVER_UNAVAILABLE", stage: "startup" },
    });
});
