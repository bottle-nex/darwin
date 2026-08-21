import type { Sandbox } from "e2b";
import { z } from "zod";

const RUNNER_ENTRY = "/opt/matcha/preview-runner/index.js";
const PREVIEW_DIR = "/home/user/preview";
const COMMAND_TIMEOUT_MS = 15 * 60_000;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,48}$/;

const packageManagerSchema = z.enum(["bun", "pnpm", "yarn", "npm"]);
export type PackageManager = z.infer<typeof packageManagerSchema>;

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
    warnings: z.array(z.string().max(400)).max(20),
});
export type HarnessManifest = z.infer<typeof harnessManifestSchema>;

const capturedSideSchema = z.object({
    status: z.enum(["ok", "failed", "absent"]),
    file: z.string().nullable(),
    error: z.string().nullable(),
});

const shootSchema = z.object({
    ok: z.boolean(),
    shots: z.array(
        z.object({
            targetId: z.string(),
            stateId: z.string(),
            viewportId: z.string(),
            outcome: z.enum(["Rendered", "Added", "Removed", "Unavailable"]),
            base: capturedSideSchema,
            head: capturedSideSchema,
            diffFile: z.string().nullable(),
            diffPercentage: z.number().nullable(),
            error: z.string().nullable(),
        }),
    ),
    warnings: z.array(z.string()),
});
export type PreviewShoot = z.infer<typeof shootSchema>;

export interface PreviewViewport {
    id: string;
    label: string;
    width: number;
    height: number;
}

export interface ShootRequest {
    headUrl: string;
    baseUrl: string | null;
    workspaceRoot: string;
    nextAppDir: string;
    outputDir: string;
    viewports: PreviewViewport[];
    frozenNowMs: number;
    maxShots: number;
}

export default class PreviewRunner {
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
     * Takes every screenshot and compares each base/head pair.
     *
     * Passing a null base URL is a supported outcome, not an error: when the base dev server never
     * came up, head-only pictures still ship and every shot is reported as added.
     *
     * @example
     * await PreviewRunner.shoot(sandbox, { headUrl, baseUrl, workspaceRoot, nextAppDir, outputDir, viewports, frozenNowMs, maxShots });
     */
    static async shoot(sandbox: Sandbox, request: ShootRequest): Promise<PreviewShoot> {
        return this.invoke(
            sandbox,
            "shoot",
            {
                revisions: { head: request.headUrl, base: request.baseUrl },
                workspaceRoot: request.workspaceRoot,
                nextAppDir: request.nextAppDir,
                outputDir: request.outputDir,
                viewports: request.viewports,
                frozenNowMs: request.frozenNowMs,
                randomSeed: 1,
                maxShots: request.maxShots,
            },
            shootSchema,
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
