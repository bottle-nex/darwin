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

import {
    create_next_preview_surface,
    remove_next_preview_surface,
} from "../../../../packages/preview-runner/src/adapters/next/preview_surface";
import { inspect_next_workspace } from "../../../../packages/preview-runner/src/adapters/next/workspace";
import {
    replayReviewPlanSchema,
    type ReplayScenario,
    type ReplaySurface,
} from "../../../../packages/preview-runner/src/contract";
import { runReplayCapture } from "../../../../packages/preview-runner/src/replay/replay_runner";
import { scaffold } from "../../../../packages/preview-runner/src/scaffold";
import type { ProductDiffWorkspacePlan } from "../services/product_diff/adapter.contract";
import NextPreviewLauncher from "../services/product_diff/adapters/next/service.next_preview_launcher";
import {
    resolve_next_workspace,
    resolve_next_workspaces,
} from "../services/product_diff/adapters/next/service.next_workspace_resolver";
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
const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const FIXTURE_NEXT_VERSION = "15.5.9";
const READY_TIMEOUT_MS = 30_000;
const REPLAY_READY_TIMEOUT_MS = 60_000;
const REPLAY_PROTOCOL_VERSION = 11;

const replayFixtureConfiguration = {
    "next-replay-standalone": {
        applicationPath: ".",
        changedPaths: ["app/replay/page.tsx"],
        expectedWorkspaceKind: "Standalone",
        expectedWorkspacePackages: ["@matcha-fixture/next-replay-standalone"],
        componentSurfaces: false,
        prepareRuntime: false,
    },
    "next-replay-turborepo": {
        applicationPath: "apps/marketing",
        changedPaths: ["apps/marketing/app/replay/page.tsx"],
        expectedWorkspaceKind: "Turborepo",
        expectedWorkspacePackages: [
            "@matcha-fixture/next-replay-turborepo",
            "@matcha-fixture/replay-marketing",
            "@matcha-fixture/replay-ui",
        ],
        componentSurfaces: false,
        prepareRuntime: false,
    },
    "next-replay-nx": {
        applicationPath: "apps/store",
        changedPaths: ["apps/store/app/replay/page.tsx"],
        expectedWorkspaceKind: "Nx",
        expectedWorkspacePackages: ["@matcha-fixture/next-replay-nx"],
        componentSurfaces: false,
        prepareRuntime: false,
    },
    "next-replay-provider-isolation": {
        applicationPath: ".",
        changedPaths: ["matcha_preview/targets/provider-card.tsx"],
        expectedWorkspaceKind: "Standalone",
        expectedWorkspacePackages: ["@matcha-fixture/next-replay-provider-isolation"],
        componentSurfaces: true,
        prepareRuntime: true,
    },
    "next-replay-rive": {
        applicationPath: "apps/rive",
        changedPaths: ["apps/rive/matcha_preview/targets/rive-card.tsx"],
        expectedWorkspaceKind: "Turborepo",
        expectedWorkspacePackages: [
            "@matcha-fixture/next-replay-rive",
            "@matcha-fixture/replay-rive-app",
        ],
        componentSurfaces: false,
        prepareRuntime: true,
    },
} as const;

type ReplayFixtureName = keyof typeof replayFixtureConfiguration;

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
        command: "bun run --cwd apps/marketing dev -- --hostname 127.0.0.1 --port 41337",
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

interface ReplayFixtureVerification {
    name: ReplayFixtureName;
    workspaceKind: "Standalone" | "Turborepo" | "Nx";
    productionBuild: true;
    productionStart: true;
    interactionChangedDom: true;
    animationPresent: true;
    unexpectedRequests: string[];
    credentialedRequestMetadata: false;
    workspacePackages: string[];
    layoutModes: ("inherit" | "isolate")[];
    localWasm: boolean;
    wasmInitialized: boolean;
}

interface ReplayRuntimeVerification {
    protocolVersion: number;
    chromiumAvailable: boolean;
    replayCommandAvailable: boolean;
}

interface MultiApplicationReplayVerification {
    name: "next-replay-multi-app";
    applicationPaths: string[];
    buildCommands: string[];
    startCommands: string[];
    revisionCoordinates: string[];
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function fixturePath(name: keyof typeof expected): string {
    return fileURLToPath(new URL(`${name}/`, fixtureRoot));
}

function replay_fixture_path(name: ReplayFixtureName | "next-replay-multi-app"): string {
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

function read_workspace_package_names(lockfilePath: string): string[] {
    return [...readFileSync(lockfilePath, "utf8").matchAll(/^\s+"name": "([^"]+)",?$/gm)]
        .map((match) => match[1]!)
        .sort((left, right) => left.localeCompare(right));
}

function assert_nx_replay_targets(root: string): void {
    assert(
        !existsSync(join(root, "apps/store/package.json")),
        "next-replay-nx must not rely on an app-local package manifest",
    );
    const project = read_json(join(root, "apps/store/project.json"));
    const targets = project.targets;
    assert(targets !== null && typeof targets === "object", "next-replay-nx has no targets");
    const targetGraph = targets as Record<string, unknown>;
    const build = targetGraph.build;
    const serve = targetGraph.serve;
    assert(
        build !== null &&
            typeof build === "object" &&
            (build as Record<string, unknown>).executor === "@nx/next:build",
        "next-replay-nx does not declare an executable build target",
    );
    assert(
        serve !== null &&
            typeof serve === "object" &&
            (serve as Record<string, unknown>).executor === "@nx/next:server",
        "next-replay-nx does not declare an executable serve target",
    );
    const serveOptions = (serve as Record<string, unknown>).options;
    assert(
        serveOptions !== null &&
            typeof serveOptions === "object" &&
            (serveOptions as Record<string, unknown>).buildTarget ===
                "@matcha-fixture/replay-store:build",
        "next-replay-nx serve target is not backed by its build target",
    );
}

function verify_multi_application_replay_fixture(): MultiApplicationReplayVerification {
    const name = "next-replay-multi-app" as const;
    const root = replay_fixture_path(name);
    const changedPaths = ["apps/web/app/replay/page.tsx", "apps/admin/app/replay/page.tsx"];
    const inspection = inspect_next_workspace(root, changedPaths);
    const resolved = resolve_next_workspaces(inspection, changedPaths, null);
    assert(resolved.diagnostics.length === 0, `${name} produced workspace diagnostics`);
    assert(resolved.plans.length === 2, `${name} did not resolve both applications`);
    const plan = replayReviewPlanSchema.parse(
        JSON.parse(readFileSync(join(root, "matcha_preview/review-plan.json"), "utf8")),
    );
    const applicationPaths = resolved.plans.map((application) => application.applicationPath);
    assert(
        plan.applications.every((application) =>
            applicationPaths.includes(application.applicationPath),
        ),
        `${name} declares an unresolved application`,
    );
    const buildCommands = resolved.plans.map(
        (workspacePlan) =>
            NextPreviewLauncher.build_from_workspace_plan({
                workspaceRoot: root,
                workspacePlan,
            }).command,
    );
    const startCommands = resolved.plans.map(
        (workspacePlan) =>
            NextPreviewLauncher.from_workspace_plan({
                mode: "production",
                workspaceRoot: root,
                workspacePlan,
                port: 41439,
            }).command,
    );
    const revisionCoordinates = ["head", "base"].flatMap((revision) =>
        plan.surfaces.map((surface) => `${revision}:${surface.applicationId}:${surface.id}`),
    );

    return {
        name,
        applicationPaths,
        buildCommands,
        startCommands,
        revisionCoordinates,
    };
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
    timeoutMs = READY_TIMEOUT_MS,
): Promise<void> {
    const deadline = Date.now() + timeoutMs;
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

function replay_application_root(root: string, applicationPath: string): string {
    return applicationPath === "." ? root : join(root, applicationPath);
}

function read_replay_plan(root: string, applicationPath: string) {
    return replayReviewPlanSchema.parse(
        JSON.parse(
            readFileSync(
                join(
                    replay_application_root(root, applicationPath),
                    "matcha_preview/review-plan.json",
                ),
                "utf8",
            ),
        ),
    );
}

function verify_declared_dom_change(
    scenario: ReplayScenario,
    outcomes: { outcome: string }[],
): void {
    const clickIndex = scenario.actions.findIndex((action) => action.kind === "click");
    const changedStateIndex = scenario.actions.findIndex(
        (action, index) => index > clickIndex && action.kind === "waitFor",
    );
    assert(clickIndex >= 0, `${scenario.id} does not declare an interaction`);
    assert(changedStateIndex > clickIndex, `${scenario.id} does not declare its changed DOM state`);
    assert(
        outcomes.length === scenario.actions.length &&
            outcomes.every((outcome) => outcome.outcome === "Succeeded"),
        `${scenario.id} did not reach its declared changed DOM state`,
    );
}

function artifact_has_credentialed_request_metadata(artifactPath: string): boolean {
    const artifact = read_json(artifactPath);
    const resources = artifact.resources;
    assert(Array.isArray(resources), `${artifactPath} has no replay resources`);
    const sensitiveNames = /^(authorization|cookie|set-cookie|proxy-authorization|x-api-key)$/i;
    const sensitiveQueryNames = /(?:token|secret|password|credential|session|auth|key)/i;

    for (const value of resources) {
        assert(
            value !== null && typeof value === "object",
            `${artifactPath} has an invalid resource`,
        );
        const resource = value as Record<string, unknown>;
        const request = resource.request;
        const responseHeaders = resource.responseHeaders;
        assert(
            request !== null && typeof request === "object",
            `${artifactPath} has an invalid request`,
        );
        assert(
            responseHeaders !== null && typeof responseHeaders === "object",
            `${artifactPath} has invalid response headers`,
        );
        const requestMetadata = request as Record<string, unknown>;
        const url = new URL(String(requestMetadata.url));
        if (url.username || url.password) return true;
        if ([...url.searchParams.keys()].some((name) => sensitiveQueryNames.test(name)))
            return true;
        const variantHeaders = requestMetadata.variantHeaders;
        if (
            variantHeaders !== null &&
            typeof variantHeaders === "object" &&
            Object.keys(variantHeaders).some((name) => sensitiveNames.test(name))
        ) {
            return true;
        }
        if (Object.keys(responseHeaders).some((name) => sensitiveNames.test(name))) return true;
    }
    return false;
}

function run_replay_fixture_install(root: string, temporaryDirectory: string): void {
    const lockfile = readFileSync(join(root, "bun.lock"), "utf8");
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
            cwd: root,
            encoding: "utf8",
            env: fixture_environment(temporaryDirectory),
        },
    );
    assert(
        install.status === 0,
        `replay fixture could not complete a frozen offline install: ${install.stderr || install.stdout}`,
    );
    assert(readFileSync(join(root, "bun.lock"), "utf8") === lockfile, "replay lockfile changed");
}

function prepare_component_replay_runtime(workspaceRoot: string, applicationPath: string): void {
    const applicationRoot = replay_application_root(workspaceRoot, applicationPath);
    const routeDirectory = applicationPath === "." ? "app" : `${applicationPath}/app`;
    const scaffolded = scaffold({
        workspaceRoot,
        detect: {
            supported: true,
            reason: null,
            framework: "NextAppRouter",
            nextAppDir: applicationPath,
            routeDir: routeDirectory,
            pagesDir: null,
            hasExistingPagesDir: false,
            packageManager: "bun",
            lockfileRelPath: "bun.lock",
            lockfileSha256: "fixture",
            nextMajor: 15,
            globalStylesheet: `${routeDirectory}/styles.css`,
            middlewarePaths: [],
            envExampleKeys: [],
            workspaceDirs: [],
            warnings: [],
        },
    });
    assert(scaffolded.ok, `${applicationPath} could not prepare its component runtime`);
    assert(
        existsSync(join(applicationRoot, "matcha_preview/registry.ts")),
        `${applicationPath} did not generate its component registry`,
    );
}

function replay_surface_path(
    name: ReplayFixtureName,
    surface: ReplaySurface,
    generatedRoutePath: string | null,
): string {
    if (name === "next-replay-provider-isolation" || name === "next-replay-rive") {
        return "/replay";
    }
    if (surface.entry.kind === "route") return surface.entry.path;
    assert(generatedRoutePath !== null, `${surface.id} has no generated component route`);
    return `${generatedRoutePath}/${surface.entry.targetId}?state=${surface.states[0]!.id}`;
}

async function verify_replay_fixture(name: ReplayFixtureName): Promise<ReplayFixtureVerification> {
    const configuration = replayFixtureConfiguration[name];
    const source = replay_fixture_path(name);
    const temporaryRoot = mkdtempSync(join(tmpdir(), "matcha-next-replay-"));
    const fixture = join(temporaryRoot, name);
    const temporaryDirectory = join(temporaryRoot, "tmp");
    const nxSocketDirectory = mkdtempSync("/tmp/matcha-replay-nx-");
    mkdirSync(temporaryDirectory);
    cpSync(source, fixture, { recursive: true });

    try {
        run_replay_fixture_install(fixture, temporaryDirectory);
        const workspacePackages = read_workspace_package_names(join(fixture, "bun.lock"));
        assert(
            JSON.stringify(workspacePackages) ===
                JSON.stringify([...configuration.expectedWorkspacePackages].sort()),
            `${name} lockfile does not represent every workspace package`,
        );
        if (name === "next-replay-nx") assert_nx_replay_targets(fixture);

        const inspection = inspect_next_workspace(fixture, [...configuration.changedPaths]);
        assert(
            inspection.workspaceKind === configuration.expectedWorkspaceKind,
            `${name} resolved as ${inspection.workspaceKind}`,
        );
        const resolved = resolve_next_workspace(inspection, [...configuration.changedPaths], null);
        assert(!("code" in resolved), `${name} did not resolve its replay application`);
        assert(
            resolved.applicationPath === configuration.applicationPath,
            `${name} selected ${resolved.applicationPath}`,
        );
        const plan = read_replay_plan(fixture, configuration.applicationPath);
        assert(
            plan.applications.some(
                (application) => application.applicationPath === configuration.applicationPath,
            ),
            `${name} replay plan does not declare its resolved application`,
        );
        if (configuration.prepareRuntime) {
            prepare_component_replay_runtime(fixture, configuration.applicationPath);
        }

        const buildPlan = NextPreviewLauncher.build_from_workspace_plan({
            workspaceRoot: fixture,
            workspacePlan: resolved,
            environment: { NEXT_TELEMETRY_DISABLED: "1" },
        });
        const launchPlan = NextPreviewLauncher.from_workspace_plan({
            mode: "production",
            workspaceRoot: fixture,
            workspacePlan: resolved,
            port: 41437,
            environment: { NEXT_TELEMETRY_DISABLED: "1" },
        });
        let productionBuild = false;
        let productionStart = false;
        let interactionChangedDom = false;
        let animationPresent = false;
        let credentialedRequestMetadata = false;
        let localWasm = false;
        let wasmInitialized = false;
        const unexpectedRequests: string[] = [];

        for (const surface of plan.surfaces) {
            const state = surface.states[0]!;
            const scenario = state.scenarios[0]!;
            let generatedSurface: ReturnType<typeof create_next_preview_surface> | null = null;
            let preview: ReturnType<typeof spawn> | null = null;
            let output = "";
            try {
                if (surface.entry.kind === "component") {
                    if (configuration.componentSurfaces) {
                        generatedSurface = create_next_preview_surface(fixture, {
                            applicationPath: configuration.applicationPath,
                            routeSegment: `replay-${surface.id}`,
                            router: "AppRouter",
                            rootLayoutMode: surface.rootLayoutMode,
                        });
                        const applicationRoot = replay_application_root(
                            fixture,
                            configuration.applicationPath,
                        );
                        rmSync(join(applicationRoot, "app", generatedSurface.routePath.slice(1)), {
                            recursive: true,
                            force: true,
                        });
                    }
                }
                const build = spawnSync("bash", ["-lc", buildPlan.command], {
                    cwd: buildPlan.workingDirectory,
                    encoding: "utf8",
                    timeout: 120_000,
                    env: {
                        ...fixture_environment(temporaryDirectory, nxSocketDirectory),
                        ...buildPlan.environment,
                    },
                });
                assert(
                    build.status === 0,
                    `${name} production build failed: ${build.stderr || build.stdout}`,
                );
                productionBuild = true;
                preview = spawn("bash", ["-lc", `exec ${launchPlan.command}`], {
                    cwd: launchPlan.workingDirectory,
                    detached: true,
                    env: {
                        ...fixture_environment(temporaryDirectory, nxSocketDirectory),
                        ...launchPlan.environment,
                    },
                    stdio: ["ignore", "pipe", "pipe"],
                });
                preview.stdout?.on("data", (chunk: Buffer) => {
                    output = `${output}${chunk}`.slice(-8_000);
                });
                preview.stderr?.on("data", (chunk: Buffer) => {
                    output = `${output}${chunk}`.slice(-8_000);
                });
                const surfacePath = replay_surface_path(
                    name,
                    surface,
                    generatedSurface?.routePath ?? null,
                );
                const url = `http://127.0.0.1:${launchPlan.port}${surfacePath}`;
                await wait_for_preview(url, preview, () => output, REPLAY_READY_TIMEOUT_MS);
                productionStart = true;
                const artifactRoot = join(temporaryRoot, "artifacts", surface.id);
                const capture = await runReplayCapture({
                    url,
                    artifactRoot,
                    scenario,
                    policy:
                        surface.entry.kind === "component"
                            ? { allowedQueryParameters: { state: [state.id] } }
                            : undefined,
                    browserAssets:
                        name === "next-replay-rive"
                            ? [
                                  {
                                      requestPath: "/matcha-preview-runtime/rive/rive.wasm",
                                      sourcePath: join(
                                          replay_application_root(
                                              fixture,
                                              configuration.applicationPath,
                                          ),
                                          "public/matcha-preview-runtime/rive/rive.wasm",
                                      ),
                                      contentType: "application/wasm",
                                  },
                              ]
                            : [],
                    viewport: {
                        width: surface.viewports[0]!.width,
                        height: surface.viewports[0]!.height,
                    },
                });
                assert(
                    capture.fidelity === "Verified",
                    `${name} replay was ${capture.fidelity}: ${JSON.stringify({
                        diagnostics: capture.diagnostics,
                        recording: {
                            actions: capture.recording.actions,
                            pageErrors: capture.recording.pageErrors,
                            consoleErrors: capture.recording.consoleErrors,
                            failedRequests: capture.recording.failedRequests,
                        },
                        validation: capture.validation,
                    })}`,
                );
                verify_declared_dom_change(scenario, capture.validation.actions);
                interactionChangedDom = true;
                assert(
                    capture.validation.animationPresent,
                    `${name}/${surface.id} replay has no CSS animation`,
                );
                animationPresent = true;
                unexpectedRequests.push(...capture.validation.unexpectedRequests);
                credentialedRequestMetadata ||= artifact_has_credentialed_request_metadata(
                    join(artifactRoot, capture.artifactKey),
                );
                if (name === "next-replay-rive") {
                    const applicationRoot = replay_application_root(
                        fixture,
                        configuration.applicationPath,
                    );
                    const localWasmPath = join(
                        applicationRoot,
                        "public/matcha-preview-runtime/rive/rive.wasm",
                    );
                    const artifact = read_json(join(artifactRoot, capture.artifactKey));
                    const resources = artifact.resources as Array<{
                        request: { url: string; responseContentType: string | null };
                    }>;
                    localWasm =
                        existsSync(localWasmPath) &&
                        WebAssembly.validate(readFileSync(localWasmPath)) &&
                        resources.some((resource) => {
                            const url = new URL(resource.request.url);
                            return (
                                url.pathname === "/matcha-preview-runtime/rive/rive.wasm" &&
                                resource.request.responseContentType === "application/wasm"
                            );
                        });
                    assert(localWasm, "next-replay-rive did not capture its local Rive WASM");
                    const runtimeReadyActionIndex = scenario.actions.findIndex(
                        (action) =>
                            action.kind === "waitFor" &&
                            action.selector.testId === "rive-runtime-ready",
                    );
                    wasmInitialized =
                        runtimeReadyActionIndex >= 0 &&
                        capture.validation.actions[runtimeReadyActionIndex]?.outcome ===
                            "Succeeded";
                    assert(
                        wasmInitialized,
                        "next-replay-rive did not initialize its local Rive runtime offline",
                    );
                }
            } finally {
                if (preview) await stop_preview(preview);
                if (generatedSurface) remove_next_preview_surface(generatedSurface);
            }
        }

        assert(unexpectedRequests.length === 0, `${name} made external offline requests`);
        assert(!credentialedRequestMetadata, `${name} retained credentialed request metadata`);
        return {
            name,
            workspaceKind: configuration.expectedWorkspaceKind,
            productionBuild: productionBuild as true,
            productionStart: productionStart as true,
            interactionChangedDom: interactionChangedDom as true,
            animationPresent: animationPresent as true,
            unexpectedRequests,
            credentialedRequestMetadata: false,
            workspacePackages,
            layoutModes: plan.surfaces.map((surface) => surface.rootLayoutMode),
            localWasm,
            wasmInitialized,
        };
    } finally {
        rmSync(temporaryRoot, { recursive: true, force: true });
        rmSync(nxSocketDirectory, { recursive: true, force: true });
    }
}

function verify_replay_runtime(): ReplayRuntimeVerification {
    const version = spawnSync("bun", ["packages/preview-runner/src/index.ts", "version"], {
        cwd: repositoryRoot,
        encoding: "utf8",
    });
    assert(version.status === 0, `preview runner version failed: ${version.stderr}`);
    const versionOutput = read_json_output(version.stdout, "preview runner version");
    assert(
        versionOutput.version === REPLAY_PROTOCOL_VERSION,
        `preview runner protocol is ${versionOutput.version}`,
    );

    const doctor = spawnSync("bun", ["packages/preview-runner/src/index.ts", "doctor"], {
        cwd: repositoryRoot,
        encoding: "utf8",
    });
    assert(doctor.status === 0, `preview runner doctor failed: ${doctor.stderr}`);
    const doctorOutput = read_json_output(doctor.stdout, "preview runner doctor");
    assert(doctorOutput.ok === true, "preview runner doctor is not healthy");
    assert(
        typeof doctorOutput.chromiumVersion === "string" && doctorOutput.chromiumVersion.length > 0,
        "preview runner doctor cannot launch Chromium",
    );
    assert(
        doctorOutput.replayCommandAvailable === true,
        "preview runner doctor cannot run replay capture",
    );
    return {
        protocolVersion: REPLAY_PROTOCOL_VERSION,
        chromiumAvailable: true,
        replayCommandAvailable: true,
    };
}

function read_json_output(output: string, label: string): Record<string, unknown> {
    try {
        const parsed = JSON.parse(output);
        assert(parsed !== null && typeof parsed === "object", `${label} returned a non-object`);
        return parsed as Record<string, unknown>;
    } catch {
        throw new Error(`${label} returned invalid JSON`);
    }
}

export async function verify_next_product_diff_fixtures(): Promise<{
    ready: ReadyFixtureVerification[];
    readyLaunch: ReadyLaunchVerification[];
    providerFailure: ProviderFailureVerification;
    installability: FixtureInstallability[];
    replay: ReplayFixtureVerification[];
    runtime: ReplayRuntimeVerification;
    multiApplicationReplay: MultiApplicationReplayVerification;
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

    const replay: ReplayFixtureVerification[] = [];
    for (const fixtureName of Object.keys(replayFixtureConfiguration) as ReplayFixtureName[]) {
        const path = replay_fixture_path(fixtureName);
        assert(existsSync(path), `Missing Next replay fixture: ${fixtureName}`);
        assert(existsSync(join(path, "bun.lock")), `${fixtureName} is missing a lockfile`);
        replay.push(await verify_replay_fixture(fixtureName));
    }

    return {
        ready,
        readyLaunch,
        providerFailure: verify_provider_failure(resolve_fixture_plan("next-provider-failure")),
        installability: (Object.keys(expected) as (keyof typeof expected)[]).map(
            verify_fixture_installability,
        ),
        replay,
        runtime: verify_replay_runtime(),
        multiApplicationReplay: verify_multi_application_replay_fixture(),
    };
}

if (import.meta.main) await verify_next_product_diff_fixtures();
