import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { inspect_next_workspace } from "../../../../packages/preview-runner/src/adapters/next/workspace";
import type { ProductDiffWorkspacePlan } from "../services/product_diff/adapter.contract";
import { resolve_next_workspace } from "../services/product_diff/adapters/next/service.next_workspace_resolver";
import ProductDiffPreviewLifecycle from "../services/product_diff/service.preview_lifecycle";
import PreviewServer from "../services/service.preview_server";

const expected = {
    "next-standalone": { workspaceKind: "Standalone", outcome: "Ready" },
    "next-turborepo": { workspaceKind: "Turborepo", outcome: "Ready" },
    "next-nx": { workspaceKind: "Nx", outcome: "Ready" },
    "next-ambiguous-workspace": { code: "APPLICATION_SELECTION_AMBIGUOUS" },
    "next-provider-failure": { status: "PreviewUnavailable" },
} as const;

const fixtureRoot = new URL("../../../../packages/preview-runner/fixtures/", import.meta.url);

const fixtureConfiguration = {
    "next-standalone": {
        changedPaths: [],
        applicationPath: ".",
        lockfile: "package-lock.json",
        visualRoute: "app/page.tsx",
    },
    "next-turborepo": {
        changedPaths: ["apps/marketing/app/page.tsx"],
        applicationPath: "apps/marketing",
        lockfile: "pnpm-lock.yaml",
        visualRoute: "apps/marketing/app/page.tsx",
    },
    "next-nx": {
        changedPaths: ["apps/store/app/page.tsx"],
        applicationPath: "apps/store",
        lockfile: "bun.lock",
        visualRoute: "apps/store/app/page.tsx",
    },
    "next-ambiguous-workspace": {
        changedPaths: ["packages/ui/Button.tsx"],
        lockfile: "pnpm-lock.yaml",
        visualRoute: "apps/marketing/app/page.tsx",
    },
    "next-provider-failure": {
        changedPaths: ["app/layout.tsx"],
        applicationPath: ".",
        lockfile: "package-lock.json",
        visualRoute: "app/page.tsx",
    },
} as const;

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function fixturePath(name: keyof typeof expected): string {
    return fileURLToPath(new URL(`${name}/`, fixtureRoot));
}

function resolveFixturePlan(
    name: "next-standalone" | "next-turborepo" | "next-nx" | "next-provider-failure",
): ProductDiffWorkspacePlan {
    const configuration = fixtureConfiguration[name];
    const inspection = inspect_next_workspace(fixturePath(name), [...configuration.changedPaths]);
    const expectation = expected[name];

    if ("workspaceKind" in expectation) {
        assert(
            inspection.workspaceKind === expectation.workspaceKind,
            `${name} workspace kind was ${inspection.workspaceKind}`,
        );
    }
    const resolved = resolve_next_workspace(inspection, [...configuration.changedPaths], null);
    assert(!("code" in resolved), `${name} did not resolve a workspace plan`);
    assert(
        resolved.applicationPath === configuration.applicationPath,
        `${name} selected ${resolved.applicationPath}`,
    );
    return resolved;
}

async function verifyProviderFailure(plan: ProductDiffWorkspacePlan): Promise<void> {
    const root = fixturePath("next-provider-failure");
    const layout = readFileSync(`${root}/app/layout.tsx`, "utf8");
    assert(
        layout.includes('from "unavailable-preview-provider"'),
        "next-provider-failure does not import an unavailable provider",
    );

    const previewServer = PreviewServer as unknown as { start: () => Promise<never> };
    const originalStart = previewServer.start;
    previewServer.start = async () => {
        throw new Error("Cannot find module 'unavailable-preview-provider'");
    };

    try {
        const preview = await ProductDiffPreviewLifecycle.start_and_verify({
            sandbox: {} as never,
            log: {} as never,
            revision: "head",
            workspaceRoot: root,
            workspacePlan: plan,
            launchPlan: {
                command: "npm run dev -- --hostname 127.0.0.1 --port 41337",
                workingDirectory: root,
                port: 41337,
                healthPath: "/",
                environment: {},
            },
            runId: "fixture-provider-failure",
        });
        const status = preview.health.ok ? "Ready" : "PreviewUnavailable";
        assert(
            status === expected["next-provider-failure"].status,
            `next-provider-failure settled as ${status}`,
        );
        assert(
            preview.health.diagnostic?.code === "PREVIEW_SURFACE_UNAVAILABLE",
            "next-provider-failure did not retain its preview diagnostic category",
        );
    } finally {
        previewServer.start = originalStart;
    }
}

for (const fixtureName of Object.keys(expected)) {
    const path = fixturePath(fixtureName as keyof typeof expected);
    if (!existsSync(path)) {
        throw new Error(`Missing Next Product Diff fixture: ${fixtureName}`);
    }
    const configuration = fixtureConfiguration[fixtureName as keyof typeof fixtureConfiguration];
    assert(existsSync(`${path}/${configuration.lockfile}`), `${fixtureName} is missing a lockfile`);
    assert(
        existsSync(`${path}/${configuration.visualRoute}`),
        `${fixtureName} is missing its deterministic visual route`,
    );
}

resolveFixturePlan("next-standalone");
resolveFixturePlan("next-turborepo");
resolveFixturePlan("next-nx");

const ambiguousConfiguration = fixtureConfiguration["next-ambiguous-workspace"];
const ambiguousInspection = inspect_next_workspace(fixturePath("next-ambiguous-workspace"), [
    ...ambiguousConfiguration.changedPaths,
]);
const ambiguous = resolve_next_workspace(
    ambiguousInspection,
    [...ambiguousConfiguration.changedPaths],
    null,
);
assert(
    "code" in ambiguous && ambiguous.code === expected["next-ambiguous-workspace"].code,
    "next-ambiguous-workspace did not report APPLICATION_SELECTION_AMBIGUOUS",
);

await verifyProviderFailure(resolveFixturePlan("next-provider-failure"));
