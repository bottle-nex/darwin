import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { ProductDiffDiagnostic } from "@trymatcha/types";

import { inspect_next_workspace } from "../../../../packages/preview-runner/src/adapters/next/workspace";
import type { ProductDiffWorkspacePlan } from "../services/product_diff/adapter.contract";
import NextPreviewLauncher from "../services/product_diff/adapters/next/service.next_preview_launcher";
import { resolve_next_workspace } from "../services/product_diff/adapters/next/service.next_workspace_resolver";
import {
    preview_unavailable_diagnostic,
    product_diff_failure_status,
} from "../services/service.product_diff";

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
        packageManifest: "package.json",
        command: "npm run dev -- --hostname 127.0.0.1 --port 41337",
    },
    "next-turborepo": {
        changedPaths: ["apps/marketing/app/page.tsx"],
        applicationPath: "apps/marketing",
        lockfile: "pnpm-lock.yaml",
        visualRoute: "apps/marketing/app/page.tsx",
        packageManifest: "apps/marketing/package.json",
        command:
            "pnpm --filter @matcha-fixture/marketing run dev -- --hostname 127.0.0.1 --port 41337",
    },
    "next-nx": {
        changedPaths: ["apps/store/app/page.tsx"],
        applicationPath: "apps/store",
        lockfile: "bun.lock",
        visualRoute: "apps/store/app/page.tsx",
        packageManifest: "apps/store/package.json",
        command:
            "bun x --no-install nx run @matcha-fixture/store:serve -- --host=127.0.0.1 --port=41337",
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

interface ReadyFixtureVerification {
    name: "next-standalone" | "next-turborepo" | "next-nx";
    applicationPath: string;
    installDirectory: string;
    healthPath: string;
    command: string;
}

interface ProviderFailureVerification {
    status: "PreviewUnavailable" | "Failed";
    diagnostic: ProductDiffDiagnostic;
    command: string[];
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function fixturePath(name: keyof typeof expected): string {
    return fileURLToPath(new URL(`${name}/`, fixtureRoot));
}

function read_json(path: string): Record<string, unknown> {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    assert(parsed !== null && typeof parsed === "object", `${path} is not a JSON object`);
    return parsed as Record<string, unknown>;
}

function has_exact_dependency(manifest: Record<string, unknown>, dependency: string): boolean {
    const dependencies = manifest.dependencies;
    return (
        dependencies !== null &&
        typeof dependencies === "object" &&
        (dependencies as Record<string, unknown>)[dependency] === "15.0.0"
    );
}

function verify_fixture_metadata(
    name: "next-standalone" | "next-turborepo" | "next-nx",
    root: string,
): void {
    const configuration = fixtureConfiguration[name];
    const manifest = read_json(`${root}/${configuration.packageManifest}`);
    assert(has_exact_dependency(manifest, "next"), `${name} does not pin Next 15.0.0`);

    if (name === "next-nx") {
        const workspaceManifest = read_json(`${root}/package.json`);
        assert(workspaceManifest.packageManager === "bun@1.3.2", "next-nx does not pin Bun 1.3.2");
        const developmentDependencies = workspaceManifest.devDependencies;
        assert(
            developmentDependencies !== null &&
                typeof developmentDependencies === "object" &&
                (developmentDependencies as Record<string, unknown>).nx === "20.0.0" &&
                (developmentDependencies as Record<string, unknown>)["@nx/next"] === "20.0.0",
            "next-nx does not pin its Nx tooling",
        );
        const project = read_json(`${root}/apps/store/project.json`);
        const targets = project.targets;
        assert(
            targets !== null &&
                typeof targets === "object" &&
                (targets as Record<string, unknown>).serve !== null &&
                typeof (targets as Record<string, unknown>).serve === "object" &&
                ((targets as Record<string, unknown>).serve as Record<string, unknown>).executor ===
                    "@nx/next:server",
            "next-nx does not declare the serve target its launch plan invokes",
        );
    }
}

function resolve_fixture_plan(
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

function verify_ready_fixture(
    name: "next-standalone" | "next-turborepo" | "next-nx",
): ReadyFixtureVerification {
    const root = fixturePath(name);
    const configuration = fixtureConfiguration[name];
    verify_fixture_metadata(name, root);
    const plan = resolve_fixture_plan(name);
    const launch = NextPreviewLauncher.from_workspace_plan({
        workspaceRoot: root,
        workspacePlan: plan,
        port: 41337,
    });

    assert(expected[name].outcome === "Ready", `${name} does not expect Ready`);
    assert(plan.installDirectory === ".", `${name} installs outside its workspace root`);
    assert(
        plan.applicationPath === configuration.applicationPath,
        `${name} selected the wrong app`,
    );
    assert(plan.healthPath === "/", `${name} does not use the root health path`);
    assert(launch.workingDirectory === root, `${name} launches from the wrong workspace`);
    assert(
        launch.healthPath === plan.healthPath,
        `${name} launch health path differs from its plan`,
    );
    assert(
        launch.command === configuration.command,
        `${name} generated an unexpected launch command`,
    );

    return {
        name,
        applicationPath: plan.applicationPath,
        installDirectory: plan.installDirectory,
        healthPath: plan.healthPath,
        command: launch.command,
    };
}

function verify_provider_failure(plan: ProductDiffWorkspacePlan): ProviderFailureVerification {
    const root = fixturePath("next-provider-failure");
    const command = [
        "build",
        "app/layout.tsx",
        "--external",
        "react",
        "--external",
        "react/jsx-dev-runtime",
    ];
    const compilation = spawnSync("bun", command, { cwd: root, encoding: "utf8" });
    const output = `${compilation.stdout}\n${compilation.stderr}`;
    assert(compilation.status !== 0, "next-provider-failure compiled successfully");
    assert(
        output.includes("unavailable-preview-provider"),
        "next-provider-failure did not compile its unavailable provider import",
    );

    const stage = "start head dev server";
    const diagnostic = preview_unavailable_diagnostic(stage, output, plan.applicationPath);
    const status = product_diff_failure_status(stage);
    assert(
        status === expected["next-provider-failure"].status,
        `next-provider-failure settled as ${status}`,
    );
    assert(
        diagnostic.code === "PREVIEW_SERVER_UNAVAILABLE",
        "next-provider-failure did not retain its startup diagnostic category",
    );
    return { status, diagnostic, command };
}

export function verify_next_product_diff_fixtures(): {
    ready: ReadyFixtureVerification[];
    providerFailure: ProviderFailureVerification;
} {
    for (const fixtureName of Object.keys(expected)) {
        const path = fixturePath(fixtureName as keyof typeof expected);
        if (!existsSync(path)) {
            throw new Error(`Missing Next Product Diff fixture: ${fixtureName}`);
        }
        const configuration =
            fixtureConfiguration[fixtureName as keyof typeof fixtureConfiguration];
        assert(
            existsSync(`${path}/${configuration.lockfile}`),
            `${fixtureName} is missing a lockfile`,
        );
        assert(
            existsSync(`${path}/${configuration.visualRoute}`),
            `${fixtureName} is missing its deterministic visual route`,
        );
    }

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

    return {
        ready: [
            verify_ready_fixture("next-standalone"),
            verify_ready_fixture("next-turborepo"),
            verify_ready_fixture("next-nx"),
        ],
        providerFailure: verify_provider_failure(resolve_fixture_plan("next-provider-failure")),
    };
}

if (import.meta.main) verify_next_product_diff_fixtures();
