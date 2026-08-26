import type { ProductDiffReplayDataPolicy, ReplayRevisionEvidence } from "@trymatcha/types";
import type { Sandbox } from "e2b";
import { z } from "zod";

const RUNNER_ENTRY = "/opt/matcha/preview-runner/index.js";
const PREVIEW_DIR = "/home/user/preview";
const COMMAND_TIMEOUT_MS = 15 * 60_000;
const RUNTIME_PROTOCOL_VERSION = 11;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,48}$/;
const MAX_WARNINGS = 20;
const MAX_WARNING_LENGTH = 400;
const DEFAULT_CAPTURE_SETTLE_MS = 250;
const ADVISORY_WARNINGS_TRUNCATED = "advisory warnings were truncated to fit preview limits";

const advisoryWarningsSchema = z
    .array(z.string())
    .catch([])
    .transform((values) => {
        const truncated =
            values.length > MAX_WARNINGS ||
            values.some((value) => value.length > MAX_WARNING_LENGTH);
        const normalized = values
            .slice(0, truncated ? MAX_WARNINGS - 1 : MAX_WARNINGS)
            .map((value) => value.slice(0, MAX_WARNING_LENGTH));
        return truncated ? [...normalized, ADVISORY_WARNINGS_TRUNCATED] : normalized;
    });

const packageManagerSchema = z.enum(["bun", "pnpm", "yarn", "npm"]);
export type PackageManager = z.infer<typeof packageManagerSchema>;

const nextWorkspaceKindSchema = z.enum(["Standalone", "PnpmWorkspace", "Turborepo", "Nx"]);
export type NextWorkspaceKind = z.infer<typeof nextWorkspaceKindSchema>;

const nextApplicationCandidateSchema = z.object({
    applicationPath: z.string().min(1),
    packageName: z.string().min(1).nullable(),
    router: z.enum(["AppRouter", "PagesRouter"]),
    hasPagesDirectory: z.boolean(),
    nxTargets: z
        .object({
            build: z.string().min(1),
            serve: z.string().min(1),
        })
        .strict()
        .optional(),
});
export type NextApplicationCandidate = z.infer<typeof nextApplicationCandidateSchema>;

const nextWorkspaceInspectionSchema = z.object({
    workspaceKind: nextWorkspaceKindSchema,
    packageManager: packageManagerSchema.nullable(),
    applications: z.array(nextApplicationCandidateSchema),
    changedApplicationPaths: z.array(z.string().min(1)),
});
export type NextWorkspaceInspection = z.infer<typeof nextWorkspaceInspectionSchema>;

const frameworkSchema = z.enum(["NextAppRouter", "NextPagesRouter"]);
export type PreviewFramework = z.infer<typeof frameworkSchema>;

const nextApplicationRouterSchema = z.enum(["AppRouter", "PagesRouter"]);
export type NextApplicationRouter = z.infer<typeof nextApplicationRouterSchema>;

const rootLayoutModeSchema = z.enum(["inherit", "isolate"]);
export type RootLayoutMode = z.infer<typeof rootLayoutModeSchema>;

const rootLayoutRestoreSchema = z.object({
    layoutPath: z.string().min(1),
    backupPath: z.string().min(1),
    generatedShellPath: z.string().min(1),
});

const previewSurfaceSchema = z.object({
    routePath: z.string().regex(/^\/[a-z0-9][a-z0-9-]{0,48}$/),
    generatedFiles: z.array(z.string().min(1)).min(1),
    router: nextApplicationRouterSchema,
    rootLayoutMode: rootLayoutModeSchema,
    rootLayoutRestore: rootLayoutRestoreSchema.nullable(),
});
export type PreviewSurface = z.infer<typeof previewSurfaceSchema>;

const detectSchema = z.object({
    supported: z.boolean(),
    reason: z.string().nullable(),
    framework: frameworkSchema.nullable(),
    nextAppDir: z.string().nullable(),
    routeDir: z.string().nullable(),
    pagesDir: z.string().nullable(),
    hasExistingPagesDir: z.boolean(),
    packageManager: packageManagerSchema.nullable(),
    lockfileRelPath: z.string().nullable(),
    lockfileSha256: z.string().nullable(),
    nextMajor: z.number().int().nullable(),
    globalStylesheet: z.string().nullable(),
    middlewarePaths: z.array(z.string()),
    envExampleKeys: z.array(z.string()),
    workspaceDirs: z.array(z.string()),
    warnings: z.array(z.string()),
});
export type PreviewDetect = z.infer<typeof detectSchema>;

const scaffoldSchema = z.object({
    ok: z.boolean(),
    routeFiles: z.array(z.string()),
    warnings: z.array(z.string()),
});
export type PreviewScaffold = z.infer<typeof scaffoldSchema>;

const harnessManifestSchema = z.object({
    targets: z
        .array(
            z.object({
                id: z.string().regex(SAFE_ID),
                label: z.string().min(1).max(80),
                sourcePath: z
                    .string()
                    .min(1)
                    .max(300)
                    .refine((value) => !value.includes(".."), "must not escape the app directory"),
                states: z
                    .array(
                        z.object({
                            id: z.string().regex(SAFE_ID),
                            label: z.string().min(1).max(80),
                        }),
                    )
                    .min(1)
                    .max(4),
            }),
        )
        .min(1)
        .max(6),
    warnings: advisoryWarningsSchema,
    rootLayoutMode: rootLayoutModeSchema.nullable().optional().default(null),
});
export type HarnessManifest = z.infer<typeof harnessManifestSchema>;

const captureResultSchema = z.object({
    targetId: z.string(),
    stateId: z.string(),
    viewportId: z.string(),
    status: z.enum(["ok", "failed"]),
    file: z.string().nullable(),
    error: z.string().nullable(),
});
export type PreviewCaptureResult = z.infer<typeof captureResultSchema>;

const captureSchema = z.object({
    ok: z.boolean(),
    side: z.enum(["head", "base"]),
    captures: z.array(captureResultSchema),
    warnings: z.array(z.string()),
});
export type PreviewCapture = z.infer<typeof captureSchema>;

const checkSchema = z.object({
    ok: z.boolean(),
    results: z.array(
        z.object({
            targetId: z.string(),
            stateId: z.string(),
            url: z.string(),
            ok: z.boolean(),
            httpStatus: z.number().int().nullable(),
            problem: z.string().nullable(),
            detail: z.string().nullable(),
        }),
    ),
    warnings: z.array(z.string()),
});
export type PreviewCheck = z.infer<typeof checkSchema>;

const runtimeVersionSchema = z.object({ version: z.literal(RUNTIME_PROTOCOL_VERSION) });

const capturedSideSchema = z.object({
    status: z.enum(["ok", "failed", "absent"]),
    file: z.string().nullable(),
    error: z.string().nullable(),
});

const pairSchema = z.object({
    ok: z.boolean(),
    shots: z.array(
        z.object({
            targetId: z.string(),
            stateId: z.string(),
            viewportId: z.string(),
            outcome: z.enum(["Rendered", "Added", "Removed", "Unavailable"]),
            base: capturedSideSchema,
            head: capturedSideSchema,
            error: z.string().nullable(),
        }),
    ),
    warnings: z.array(z.string()),
});
export type PreviewPair = z.infer<typeof pairSchema>;

const boundedReplayStringSchema = z.string().min(1).max(300);
const replaySelectorSchema = z
    .object({
        testId: boundedReplayStringSchema.optional(),
        role: boundedReplayStringSchema.optional(),
        name: boundedReplayStringSchema.optional(),
        label: boundedReplayStringSchema.optional(),
    })
    .strict()
    .refine((selector) => Object.values(selector).some((value) => value !== undefined));
const replayActionBaseSchema = z.object({ selector: replaySelectorSchema }).strict();
const replayActionSchema = z.discriminatedUnion("kind", [
    replayActionBaseSchema.extend({ kind: z.literal("click") }),
    replayActionBaseSchema.extend({ kind: z.literal("fill"), value: boundedReplayStringSchema }),
    replayActionBaseSchema.extend({ kind: z.literal("select"), value: boundedReplayStringSchema }),
    replayActionBaseSchema.extend({ kind: z.literal("check"), checked: z.boolean().optional() }),
    replayActionBaseSchema.extend({ kind: z.literal("waitFor") }),
]);
const replayScenarioSchema = z
    .object({
        id: z.string().regex(SAFE_ID),
        label: boundedReplayStringSchema,
        actions: z.array(replayActionSchema).max(12),
    })
    .strict();
const replayApplicationSchema = z
    .object({
        id: z.string().regex(SAFE_ID),
        applicationPath: boundedReplayStringSchema.refine(
            (value) => !value.includes("..") && !value.startsWith("/"),
        ),
        adapterId: boundedReplayStringSchema.optional(),
    })
    .strict();
const replayViewportSchema = z
    .object({
        id: z.string().regex(SAFE_ID),
        label: z.string().min(1).max(40),
        width: z.number().int().min(240).max(3840),
        height: z.number().int().min(240).max(3840),
    })
    .strict();
const replaySurfaceSchema = z
    .object({
        id: z.string().regex(SAFE_ID),
        applicationId: z.string().regex(SAFE_ID),
        label: boundedReplayStringSchema,
        sourcePaths: z
            .array(
                boundedReplayStringSchema.refine(
                    (value) => !value.includes("..") && !value.startsWith("/"),
                ),
            )
            .min(1)
            .max(12),
        entry: z.discriminatedUnion("kind", [
            z
                .object({
                    kind: z.literal("route"),
                    path: boundedReplayStringSchema.refine(
                        (value) => value.startsWith("/") && !value.includes(".."),
                    ),
                })
                .strict(),
            z
                .object({ kind: z.literal("component"), targetId: z.string().regex(SAFE_ID) })
                .strict(),
        ]),
        rootLayoutMode: rootLayoutModeSchema,
        states: z
            .array(
                z
                    .object({
                        id: z.string().regex(SAFE_ID),
                        label: boundedReplayStringSchema,
                        scenarios: z.array(replayScenarioSchema).max(12),
                    })
                    .strict(),
            )
            .min(1)
            .max(6),
        viewports: z.array(replayViewportSchema).min(1).max(4),
    })
    .strict();
const replayReviewPlanSchema = z
    .object({
        applications: z.array(replayApplicationSchema).min(1).max(12),
        surfaces: z.array(replaySurfaceSchema).min(1).max(12),
    })
    .strict()
    .superRefine((plan, context) => {
        const addDuplicateIssues = (
            ids: string[],
            issuePaths: Array<Array<string | number>>,
            message: string,
        ) => {
            const seen = new Set<string>();
            for (const [index, id] of ids.entries()) {
                if (seen.has(id)) {
                    context.addIssue({ code: "custom", path: issuePaths[index], message });
                }
                seen.add(id);
            }
        };
        addDuplicateIssues(
            plan.applications.map((application) => application.id),
            plan.applications.map((_, index) => ["applications", index, "id"]),
            "must be unique within the review plan",
        );
        const applicationIds = new Set(plan.applications.map((application) => application.id));
        const surfaceIdsByApplication = new Map<string, Set<string>>();
        for (const [index, surface] of plan.surfaces.entries()) {
            if (!applicationIds.has(surface.applicationId)) {
                context.addIssue({
                    code: "custom",
                    path: ["surfaces", index, "applicationId"],
                    message: "must reference a declared application",
                });
            }
            const surfaceIds = surfaceIdsByApplication.get(surface.applicationId) ?? new Set();
            if (surfaceIds.has(surface.id)) {
                context.addIssue({
                    code: "custom",
                    path: ["surfaces", index, "id"],
                    message: "must be unique within the application",
                });
            }
            surfaceIds.add(surface.id);
            surfaceIdsByApplication.set(surface.applicationId, surfaceIds);
            addDuplicateIssues(
                surface.states.map((state) => state.id),
                surface.states.map((_, stateIndex) => [
                    "surfaces",
                    index,
                    "states",
                    stateIndex,
                    "id",
                ]),
                "must be unique within the surface",
            );
            addDuplicateIssues(
                surface.viewports.map((viewport) => viewport.id),
                surface.viewports.map((_, viewportIndex) => [
                    "surfaces",
                    index,
                    "viewports",
                    viewportIndex,
                    "id",
                ]),
                "must be unique within the surface",
            );
            for (const [stateIndex, state] of surface.states.entries()) {
                addDuplicateIssues(
                    state.scenarios.map((scenario) => scenario.id),
                    state.scenarios.map((_, scenarioIndex) => [
                        "surfaces",
                        index,
                        "states",
                        stateIndex,
                        "scenarios",
                        scenarioIndex,
                        "id",
                    ]),
                    "must be unique within the state",
                );
            }
        }
    });
export type ReplayReviewPlan = z.infer<typeof replayReviewPlanSchema>;
export type ReplaySurface = z.infer<typeof replaySurfaceSchema>;
export type ReplayScenario = z.infer<typeof replayScenarioSchema>;

const replayBrowserAssetSchema = z
    .object({
        requestPath: z.string().min(1).max(500).startsWith("/"),
        sourcePath: z.string().min(1).max(500).startsWith("/"),
        contentType: z.string().min(1).max(200),
    })
    .strict();
const replayActionEvidenceSchema = z
    .object({
        index: z.number().int().min(0).max(11),
        kind: z.enum(["click", "fill", "select", "check", "waitFor"]),
        outcome: z.enum(["Succeeded", "Failed"]),
        diagnostic: z.string().max(300).optional(),
    })
    .strict();
const emptyReplayEvidence: ReplayRevisionEvidence = {
    scenarios: [],
    dom: null,
    accessibility: null,
    consoleDiagnostics: [],
    failedRequestDiagnostics: [],
};
export const replayEvidenceSchema: z.ZodType<ReplayRevisionEvidence> = z
    .object({
        scenarios: z
            .array(
                z
                    .object({
                        id: z.string().regex(SAFE_ID),
                        label: z.string().min(1).max(300),
                        outcome: z.enum(["Succeeded", "Failed"]),
                        actions: z.array(replayActionEvidenceSchema).max(12),
                    })
                    .strict(),
            )
            .max(12),
        dom: z
            .object({
                elementCount: z.number().int().min(0).max(1_000_000),
                interactiveElementCount: z.number().int().min(0).max(1_000_000),
                visibleTextLength: z.number().int().min(0).max(10_000_000),
            })
            .strict()
            .nullable(),
        accessibility: z
            .object({
                landmarkCount: z.number().int().min(0).max(1_000_000),
                headingCount: z.number().int().min(0).max(1_000_000),
                labeledControlCount: z.number().int().min(0).max(1_000_000),
                unlabeledControlCount: z.number().int().min(0).max(1_000_000),
            })
            .strict()
            .nullable(),
        consoleDiagnostics: z.array(z.string().max(300)).max(20),
        failedRequestDiagnostics: z.array(z.string().max(300)).max(20),
    })
    .strict();
const replayCaptureOutputSchema = z
    .object({
        artifactKey: z.literal("artifact.json"),
        fidelity: z.enum(["Verified", "Partial", "Unavailable"]),
        diagnostics: z.array(z.string().max(300)).max(20),
        resourceCount: z.number().int().min(0).max(10_000),
        packageBytes: z.number().int().min(0).max(500_000_000),
        captureDurationMs: z.number().int().min(0).max(3_600_000),
        validationOutcome: z.enum(["Verified", "Partial", "Unavailable"]),
        evidence: replayEvidenceSchema.default(emptyReplayEvidence),
    })
    .strict();
export type ReplayCaptureOutput = z.infer<typeof replayCaptureOutputSchema>;

export interface ReplayCaptureRequest {
    url: string;
    artifactRoot: string;
    scenario: ReplayScenario;
    scenarios?: ReplayScenario[];
    viewport: { width: number; height: number };
    browserAssets: z.infer<typeof replayBrowserAssetSchema>[];
    dataPolicy?: ProductDiffReplayDataPolicy;
}

export interface PreviewViewport {
    id: string;
    label: string;
    width: number;
    height: number;
}

export interface CaptureRequest {
    url: string;
    routePath: string;
    side: "head" | "base";
    workspaceRoot: string;
    nextAppDir: string;
    outputDir: string;
    viewports: PreviewViewport[];
    frozenNowMs: number;
    settleMs?: number;
    maxShots: number;
}

class PreviewRunnerCommandError extends Error {
    readonly code = "PREVIEW_RUNNER_COMMAND_FAILED";
    readonly command: string;
    readonly exitCode: number | null;

    constructor(command: string, exitCode: number | null) {
        super("Preview runner command failed");
        this.name = "PreviewRunnerCommandError";
        this.command = command;
        this.exitCode = exitCode;
    }
}

function command_exit_code(error: unknown): number | null {
    if (!error || typeof error !== "object" || !("exitCode" in error)) return null;
    const exitCode = error.exitCode;
    return typeof exitCode === "number" && Number.isSafeInteger(exitCode) ? exitCode : null;
}

function replay_policy(url: string, dataPolicy?: ProductDiffReplayDataPolicy) {
    const state = new URL(url).searchParams.get("state");
    const allowedQueryParameters = state ? { state: [state] } : undefined;
    if (!dataPolicy && !allowedQueryParameters) return undefined;
    return {
        ...(allowedQueryParameters && { allowedQueryParameters }),
        ...(dataPolicy && { sameOriginJsonPaths: dataPolicy.sameOriginJsonPaths }),
    };
}

export default class PreviewRunner {
    static async supports_current_protocol(sandbox: Sandbox): Promise<boolean> {
        const result = await sandbox.commands
            .run(`node ${RUNNER_ENTRY} version`, { timeoutMs: 10_000 })
            .catch(() => null);
        if (!result || result.exitCode !== 0) return false;

        try {
            return runtimeVersionSchema.safeParse(JSON.parse(result.stdout)).success;
        } catch {
            return false;
        }
    }

    private static async invoke<T>(
        sandbox: Sandbox,
        command: string,
        input: unknown,
        schema: z.ZodType<T>,
    ): Promise<T> {
        const inputPath = `${PREVIEW_DIR}/${command}-in.json`;
        const outputPath = `${PREVIEW_DIR}/${command}-out.json`;

        await sandbox.files.write(inputPath, JSON.stringify(input));
        let result;
        try {
            result = await sandbox.commands.run(
                `node ${RUNNER_ENTRY} ${command} --input ${inputPath} --output ${outputPath}`,
                { timeoutMs: COMMAND_TIMEOUT_MS },
            );
        } catch (error) {
            throw new PreviewRunnerCommandError(command, command_exit_code(error));
        }
        if (result.exitCode !== 0) {
            throw new PreviewRunnerCommandError(command, result.exitCode);
        }
        return schema.parse(JSON.parse(await sandbox.files.read(outputPath)));
    }

    /**
     * Asks the sandbox what kind of project this is and how to start it.
     *
     * The changed file list matters in a repository holding several Next.js apps: it is what picks
     * the app the pull request actually touched instead of guessing at the first one found.
     *
     * @example
     * await PreviewRunner.detect(sandbox, "/home/user/workspace/head", ["apps/web/app/page.tsx"]);
     * // { supported: true, framework: "NextAppRouter", nextAppDir: "apps/web", packageManager: "bun", ... }
     */
    static async detect(
        sandbox: Sandbox,
        workspaceRoot: string,
        changedPaths: string[],
    ): Promise<PreviewDetect> {
        return this.invoke(sandbox, "detect", { workspaceRoot, changedPaths }, detectSchema);
    }

    static async inspect_next_workspace(
        sandbox: Sandbox,
        workspaceRoot: string,
        changedPaths: string[],
    ): Promise<NextWorkspaceInspection> {
        return this.invoke(
            sandbox,
            "inspect-next-workspace",
            { workspaceRoot, changedPaths },
            nextWorkspaceInspectionSchema,
        );
    }

    static async create_next_preview_surface(
        sandbox: Sandbox,
        input: {
            workspaceRoot: string;
            applicationPath: string;
            routeSegment: string;
            router: NextApplicationRouter;
            rootLayoutMode: RootLayoutMode;
        },
    ): Promise<PreviewSurface> {
        return this.invoke(sandbox, "create-next-preview-surface", input, previewSurfaceSchema);
    }

    static async remove_next_preview_surface(
        sandbox: Sandbox,
        surface: PreviewSurface,
    ): Promise<void> {
        await this.invoke(
            sandbox,
            "remove-next-preview-surface",
            { surface },
            z.object({ ok: z.literal(true) }),
        );
    }

    static async scaffold(
        sandbox: Sandbox,
        workspaceRoot: string,
        detect: PreviewDetect,
    ): Promise<PreviewScaffold> {
        return this.invoke(sandbox, "scaffold", { workspaceRoot, detect }, scaffoldSchema);
    }

    /**
     * Photographs one revision and writes a PNG per target, state and screen size.
     *
     * One revision per call, on purpose. Two Next.js dev servers compiling a real app at the same
     * time need more memory than the sandbox has, and the kernel kills one of them — so the head
     * revision is captured, stopped, and only then does the base revision start.
     *
     * @example
     * await PreviewRunner.capture(sandbox, { url: headUrl, side: "head", ... });
     * // { ok: true, side: "head", captures: [{ file: "header-nav/default/desktop/head.png" }] }
     */
    static async capture(sandbox: Sandbox, request: CaptureRequest): Promise<PreviewCapture> {
        return this.invoke(
            sandbox,
            "capture",
            {
                url: request.url,
                routePath: request.routePath,
                side: request.side,
                workspaceRoot: request.workspaceRoot,
                nextAppDir: request.nextAppDir,
                outputDir: request.outputDir,
                viewports: request.viewports,
                frozenNowMs: request.frozenNowMs,
                randomSeed: 1,
                settleMs: request.settleMs ?? DEFAULT_CAPTURE_SETTLE_MS,
                maxShots: request.maxShots,
            },
            captureSchema,
        );
    }

    static async check(
        sandbox: Sandbox,
        settings: { baseUrl: string; routePath: string; workspaceRoot: string; nextAppDir: string },
    ): Promise<PreviewCheck> {
        return this.invoke(sandbox, "check", settings, checkSchema);
    }

    static async pair(
        sandbox: Sandbox,
        head: PreviewCaptureResult[],
        base: PreviewCaptureResult[],
    ): Promise<PreviewPair> {
        return this.invoke(sandbox, "pair", { head, base }, pairSchema);
    }

    static async replay_capture(
        sandbox: Sandbox,
        request: ReplayCaptureRequest,
    ): Promise<ReplayCaptureOutput> {
        return this.invoke(
            sandbox,
            "replay-capture",
            {
                url: request.url,
                artifactRoot: request.artifactRoot,
                scenario: replayScenarioSchema.parse(request.scenario),
                ...(request.scenarios
                    ? {
                          scenarios: z
                              .array(replayScenarioSchema)
                              .min(1)
                              .max(12)
                              .parse(request.scenarios),
                      }
                    : {}),
                policy: replay_policy(request.url, request.dataPolicy),
                viewport: replayViewportSchema
                    .pick({ width: true, height: true })
                    .parse(request.viewport),
                browserAssets: z
                    .array(replayBrowserAssetSchema)
                    .max(10_000)
                    .parse(request.browserAssets),
            },
            replayCaptureOutputSchema,
        );
    }

    /**
     * Reads and validates the target list the harness agent wrote.
     *
     * The identifier rule is load bearing rather than cosmetic: these strings become path segments
     * in object storage, so an identifier like `../../other-project` would write outside this
     * Product Diff's own prefix.
     *
     * @example
     * await PreviewRunner.read_manifest(sandbox, "/home/user/workspace/head/apps/web");
     * // { targets: [{ id: "header-nav", label: "Header navigation", states: [...] }], warnings: [] }
     */
    static async read_manifest(sandbox: Sandbox, appDir: string): Promise<HarnessManifest> {
        const raw = await sandbox.files.read(`${appDir}/matcha_preview/manifest.json`);
        return harnessManifestSchema.parse(JSON.parse(raw));
    }

    static async read_replay_plan(sandbox: Sandbox, appDir: string): Promise<ReplayReviewPlan> {
        const raw = await sandbox.files.read(`${appDir}/matcha_preview/review-plan.json`);
        return replayReviewPlanSchema.parse(JSON.parse(raw));
    }

    /**
     * Writes the small settings file the agent's `preview-check` command reads.
     *
     * Keeping these values on disk is what lets the agent verify its work by typing one word,
     * instead of assembling JSON payloads it could get wrong.
     *
     * @example
     * await PreviewRunner.write_check_env(sandbox, { workspaceRoot, nextAppDir: "apps/web", baseUrl, mode: "AppRoute", detect });
     */
    static async write_check_env(
        sandbox: Sandbox,
        settings: {
            workspaceRoot: string;
            nextAppDir: string;
            baseUrl: string;
            detect: PreviewDetect;
        },
    ): Promise<void> {
        await sandbox.files.write(`${PREVIEW_DIR}/check-env.json`, JSON.stringify(settings));
    }
}
