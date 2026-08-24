import type { Sandbox } from "e2b";
import { z } from "zod";

const RUNNER_ENTRY = "/opt/matcha/preview-runner/index.js";
const PREVIEW_DIR = "/home/user/preview";
const COMMAND_TIMEOUT_MS = 15 * 60_000;
const RUNTIME_PROTOCOL_VERSION = 4;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,48}$/;
const MAX_WARNINGS = 20;
const MAX_WARNING_LENGTH = 400;

const advisoryWarningsSchema = z
    .array(z.string())
    .catch([])
    .transform((values) =>
        values.slice(0, MAX_WARNINGS).map((value) => value.slice(0, MAX_WARNING_LENGTH)),
    );

const packageManagerSchema = z.enum(["bun", "pnpm", "yarn", "npm"]);
export type PackageManager = z.infer<typeof packageManagerSchema>;

const nextWorkspaceKindSchema = z.enum(["Standalone", "PnpmWorkspace", "Turborepo", "Nx"]);
export type NextWorkspaceKind = z.infer<typeof nextWorkspaceKindSchema>;

const nextApplicationCandidateSchema = z.object({
    applicationPath: z.string().min(1),
    packageName: z.string().min(1).nullable(),
    router: z.enum(["AppRouter", "PagesRouter"]),
    hasPagesDirectory: z.boolean(),
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

export type ScaffoldMode = "AppRoute" | "PagesEscape";

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

export interface PreviewViewport {
    id: string;
    label: string;
    width: number;
    height: number;
}

export interface CaptureRequest {
    url: string;
    side: "head" | "base";
    workspaceRoot: string;
    nextAppDir: string;
    outputDir: string;
    viewports: PreviewViewport[];
    frozenNowMs: number;
    maxShots: number;
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
        await sandbox.commands.run(
            `node ${RUNNER_ENTRY} ${command} --input ${inputPath} --output ${outputPath}`,
            { timeoutMs: COMMAND_TIMEOUT_MS },
        );
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

    /**
     * Generates the preview route files for one revision.
     *
     * Always run by the pipeline, never by the agent — which is what makes it safe to run the very
     * same generation on the base revision, where the agent never went.
     *
     * @example
     * await PreviewRunner.scaffold(sandbox, "/home/user/workspace/base", detect, "AppRoute");
     * // { ok: true, routeFiles: ["apps/web/app/matcha-preview/[targetId]/page.tsx", ...] }
     */
    static async scaffold(
        sandbox: Sandbox,
        workspaceRoot: string,
        detect: PreviewDetect,
        mode: ScaffoldMode,
    ): Promise<PreviewScaffold> {
        return this.invoke(sandbox, "scaffold", { workspaceRoot, detect, mode }, scaffoldSchema);
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
                side: request.side,
                workspaceRoot: request.workspaceRoot,
                nextAppDir: request.nextAppDir,
                outputDir: request.outputDir,
                viewports: request.viewports,
                frozenNowMs: request.frozenNowMs,
                randomSeed: 1,
                maxShots: request.maxShots,
            },
            captureSchema,
        );
    }

    static async check(
        sandbox: Sandbox,
        settings: { baseUrl: string; workspaceRoot: string; nextAppDir: string },
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
            mode: ScaffoldMode;
            detect: PreviewDetect;
        },
    ): Promise<void> {
        await sandbox.files.write(`${PREVIEW_DIR}/check-env.json`, JSON.stringify(settings));
    }
}
