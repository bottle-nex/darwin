import { spawn, spawnSync } from "node:child_process";
import {
    cpSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
const FIXTURE_NEXT_VERSION = "15.5.9";
const READY_TIMEOUT_MS = 30_000;

const fixtureConfiguration = {
    "next-standalone": {
        changedPaths: [],
        applicationPath: ".",
        lockfile: "bun.lock",
        visualRoute: "app/page.tsx",
        packageManifest: "package.json",
        command: "bun run dev -- --hostname 127.0.0.1 --port 41337",
    },
    "next-turborepo": {
        changedPaths: ["apps/marketing/app/page.tsx"],
        applicationPath: "apps/marketing",
        lockfile: "bun.lock",
        visualRoute: "apps/marketing/app/page.tsx",
        packageManifest: "apps/marketing/package.json",
        command:
            "bun run --filter @matcha-fixture/marketing dev -- --hostname 127.0.0.1 --port 41337",
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
        lockfile: "bun.lock",
        visualRoute: "apps/marketing/app/page.tsx",
    },
    "next-provider-failure": {
        changedPaths: ["app/layout.tsx"],
        applicationPath: ".",
        lockfile: "bun.lock",
        visualRoute: "app/page.tsx",
    },
} as const;

interface ReadyFixtureVerification {
    name: "next-standalone" | "next-turborepo" | "next-nx";
    applicationPath: string;
    installDirectory: string;
    healthPath: string;
    command: string;
    buildTarget: string | null;
}

interface ProviderFailureVerification {
    status: "PreviewUnavailable" | "Failed";
    hermetic: boolean;
    ancestorPoisoned: boolean;
    diagnostic: ProductDiffDiagnostic;
    command: string[];
}

interface FixtureInstallability {
    name: keyof typeof expected;
    frozen: boolean;
}

interface ReadyLaunchVerification {
    name: ReadyFixtureVerification["name"];
    ready: boolean;
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
        (dependencies as Record<string, unknown>)[dependency] === FIXTURE_NEXT_VERSION
    );
}

function verify_fixture_metadata(
    name: "next-standalone" | "next-turborepo" | "next-nx",
    root: string,
): string | null {
    const configuration = fixtureConfiguration[name];
    const manifest = read_json(`${root}/${configuration.packageManifest}`);
    assert(
        has_exact_dependency(manifest, "next"),
        `${name} does not pin Next ${FIXTURE_NEXT_VERSION}`,
    );

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
        const targetGraph = targets as Record<string, unknown>;
        assert(
            targets !== null &&
                typeof targets === "object" &&
                targetGraph.serve !== null &&
                typeof targetGraph.serve === "object" &&
                (targetGraph.serve as Record<string, unknown>).executor === "@nx/next:server",
            "next-nx does not declare the serve target its launch plan invokes",
        );
        assert(
            targetGraph.build !== null &&
                typeof targetGraph.build === "object" &&
                (targetGraph.build as Record<string, unknown>).executor === "@nx/next:build",
            "next-nx does not declare the build target consumed by serve",
        );
        const serveOptions = (targetGraph.serve as Record<string, unknown>).options;
        assert(
            serveOptions !== null &&
                typeof serveOptions === "object" &&
                (serveOptions as Record<string, unknown>).buildTarget ===
                    "@matcha-fixture/store:build",
            "next-nx serve does not consume its declared build target",
        );
        return "@matcha-fixture/store:build";
    }
    return null;
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
    const buildTarget = verify_fixture_metadata(name, root);
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
        buildTarget,
    };
}

function verify_provider_failure(plan: ProductDiffWorkspacePlan): ProviderFailureVerification {
    const source = fixturePath("next-provider-failure");
    const temporaryRoot = mkdtempSync(join(tmpdir(), "matcha-next-provider-"));
    const executionRoot = join(temporaryRoot, "execution");
    const fixture = join(executionRoot, "next-provider-failure");
    const temporaryDirectory = join(temporaryRoot, "tmp");
    mkdirSync(temporaryDirectory);
    mkdirSync(join(temporaryRoot, "node_modules", "unavailable-preview-provider"), {
        recursive: true,
    });
    writeFileSync(
        join(temporaryRoot, "node_modules", "unavailable-preview-provider", "package.json"),
        JSON.stringify({ name: "unavailable-preview-provider", main: "./index.js" }),
    );
    writeFileSync(
        join(temporaryRoot, "node_modules", "unavailable-preview-provider", "index.js"),
        'throw new Error("ancestor-poison-resolved");',
    );
    mkdirSync(join(executionRoot, "node_modules", "unavailable-preview-provider"), {
        recursive: true,
    });
    writeFileSync(
        join(executionRoot, "node_modules", "unavailable-preview-provider", "package.json"),
        JSON.stringify({ name: "unavailable-preview-provider", exports: {} }),
    );
    cpSync(source, fixture, { recursive: true });
    const command = [
        "build",
        "app/layout.tsx",
        "--root",
        executionRoot,
        "--external",
        "react",
        "--external",
        "react/jsx-dev-runtime",
    ];

    try {
        const compilation = spawnSync("bun", command, {
            cwd: fixture,
            encoding: "utf8",
            env: {
                ...process.env,
                TMPDIR: temporaryDirectory,
                TEMP: temporaryDirectory,
                TMP: temporaryDirectory,
            },
        });
        const output = `${compilation.stdout}\n${compilation.stderr}`;
        assert(compilation.status !== 0, "next-provider-failure compiled successfully");
        assert(
            output.includes("unavailable-preview-provider"),
            "next-provider-failure did not compile its unavailable provider import",
        );
        assert(
            !output.includes("ancestor-poison-resolved"),
            "next-provider-failure resolved the poisoned ancestor provider",
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
        return { status, hermetic: true, ancestorPoisoned: true, diagnostic, command };
    } finally {
        rmSync(temporaryRoot, { recursive: true, force: true });
    }
}

function verify_fixture_installability(name: keyof typeof expected): FixtureInstallability {
    const source = fixturePath(name);
    const temporaryRoot = mkdtempSync(join(tmpdir(), "matcha-next-fixture-"));
    const fixture = join(temporaryRoot, name);
    const temporaryDirectory = join(temporaryRoot, "tmp");
    mkdirSync(temporaryDirectory);
    cpSync(source, fixture, { recursive: true });

    try {
        const lockfile = readFileSync(join(fixture, "bun.lock"), "utf8");
        const install = spawnSync(
            "bun",
            [
                "install",
                "--frozen-lockfile",
                "--ignore-scripts",
                "--backend=copy",
                "--registry",
                "http://127.0.0.1:9",
            ],
            {
                cwd: fixture,
                encoding: "utf8",
                env: {
                    ...process.env,
                    TMPDIR: temporaryDirectory,
                    TEMP: temporaryDirectory,
                    TMP: temporaryDirectory,
                },
            },
        );
        assert(
            install.status === 0,
            `${name} did not complete a frozen offline install: ${install.stderr || install.stdout}`,
        );
        assert(
            readFileSync(join(fixture, "bun.lock"), "utf8") === lockfile,
            `${name} changed its frozen lockfile`,
        );
        if (name === "next-nx") {
            const nx = spawnSync("bun", ["x", "--no-install", "nx", "--version"], {
                cwd: fixture,
                encoding: "utf8",
            });
            assert(
                nx.status === 0,
                "next-nx does not install the Nx binary used by its serve plan",
            );
        }
        return { name, frozen: true };
    } finally {
        rmSync(temporaryRoot, { recursive: true, force: true });
    }
}

function fixture_environment(
    temporaryDirectory: string,
    nxSocketDirectory?: string,
): Record<string, string | undefined> {
    return {
        ...process.env,
        TMPDIR: temporaryDirectory,
        TEMP: temporaryDirectory,
        TMP: temporaryDirectory,
        NPM_CONFIG_REGISTRY: "http://127.0.0.1:9",
        npm_config_registry: "http://127.0.0.1:9",
        NX_DAEMON: "false",
        NX_SOCKET_DIR: nxSocketDirectory,
    };
}

function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function signal_preview(preview: ReturnType<typeof spawn>, signal: "SIGTERM" | "SIGKILL"): void {
    try {
        if (preview.pid !== undefined) {
            process.kill(-preview.pid, signal);
        } else {
            preview.kill(signal);
        }
    } catch {
        return;
    }
}

async function stop_preview(preview: ReturnType<typeof spawn>): Promise<void> {
    if (preview.exitCode !== null) return;
    signal_preview(preview, "SIGTERM");
    const stopped = await Promise.race([
        new Promise<boolean>((resolve) => preview.once("exit", () => resolve(true))),
        wait(5_000).then(() => false),
    ]);
    if (!stopped && preview.exitCode === null) signal_preview(preview, "SIGKILL");
}

async function wait_for_preview(
    url: string,
    preview: ReturnType<typeof spawn>,
    output: () => string,
): Promise<void> {
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
        if (preview.exitCode !== null) {
            throw new Error(`preview process exited before becoming ready: ${output()}`);
        }
        try {
            const response = await fetch(url);
            if (response.ok) return;
        } catch {
            await wait(250);
            continue;
        }
        await wait(250);
    }
    throw new Error(`preview process did not become ready before the timeout: ${output()}`);
}

async function verify_ready_launch(
    ready: ReadyFixtureVerification,
): Promise<ReadyLaunchVerification> {
    const source = fixturePath(ready.name);
    const temporaryRoot = mkdtempSync(join(tmpdir(), "matcha-next-ready-"));
    const fixture = join(temporaryRoot, ready.name);
    const temporaryDirectory = join(temporaryRoot, "tmp");
    const nxSocketDirectory = mkdtempSync("/tmp/matcha-nx-");
    mkdirSync(temporaryDirectory);
    cpSync(source, fixture, { recursive: true });
    let preview: ReturnType<typeof spawn> | null = null;
    let output = "";

    try {
        const install = spawnSync(
            "bun",
            [
                "install",
                "--frozen-lockfile",
                "--ignore-scripts",
                "--backend=copy",
                "--registry",
                "http://127.0.0.1:9",
            ],
            { cwd: fixture, encoding: "utf8", env: fixture_environment(temporaryDirectory) },
        );
        assert(
            install.status === 0,
            `${ready.name} could not prepare an isolated frozen install: ${install.stderr || install.stdout}`,
        );
        preview = spawn("bash", ["-lc", `exec ${ready.command}`], {
            cwd: fixture,
            detached: true,
            env: fixture_environment(temporaryDirectory, nxSocketDirectory),
            stdio: ["ignore", "pipe", "pipe"],
        });
        preview.stdout?.on("data", (chunk: Buffer) => {
            output = `${output}${chunk}`.slice(-4_000);
        });
        preview.stderr?.on("data", (chunk: Buffer) => {
            output = `${output}${chunk}`.slice(-4_000);
        });
        await wait_for_preview(`http://127.0.0.1:41337${ready.healthPath}`, preview, () => output);
        return { name: ready.name, ready: true };
    } finally {
        if (preview) await stop_preview(preview);
        rmSync(temporaryRoot, { recursive: true, force: true });
        rmSync(nxSocketDirectory, { recursive: true, force: true });
    }
}

export async function verify_next_product_diff_fixtures(): Promise<{
    ready: ReadyFixtureVerification[];
    readyLaunch: ReadyLaunchVerification[];
    providerFailure: ProviderFailureVerification;
    installability: FixtureInstallability[];
}> {
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

    const ready = [
        verify_ready_fixture("next-standalone"),
        verify_ready_fixture("next-turborepo"),
        verify_ready_fixture("next-nx"),
    ];

    const readyLaunch: ReadyLaunchVerification[] = [];
    for (const fixture of ready) {
        readyLaunch.push(await verify_ready_launch(fixture));
    }

    return {
        ready,
        readyLaunch,
        providerFailure: verify_provider_failure(resolve_fixture_plan("next-provider-failure")),
        installability: (Object.keys(expected) as (keyof typeof expected)[]).map(
            verify_fixture_installability,
        ),
    };
}

if (import.meta.main) await verify_next_product_diff_fixtures();
