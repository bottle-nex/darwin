import { z } from "zod";

export const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,48}$/;
export const MAX_WARNINGS = 20;
export const MAX_WARNING_LENGTH = 400;
export const ADVISORY_WARNINGS_TRUNCATED = "advisory warnings were truncated to fit preview limits";

export const advisoryWarningsSchema = z
    .array(z.string())
    .catch([])
    .transform((values) => {
        const truncated =
            values.length > MAX_WARNINGS ||
            values.some((value) => value.length > MAX_WARNING_LENGTH);
        const normalized = values
            .slice(0, MAX_WARNINGS)
            .map((value) => value.slice(0, MAX_WARNING_LENGTH));
        return truncated ? [...normalized, ADVISORY_WARNINGS_TRUNCATED] : normalized;
    });

export const packageManagerSchema = z.enum(["bun", "pnpm", "yarn", "npm"]);
export type PackageManager = z.infer<typeof packageManagerSchema>;

export const nextWorkspaceKindSchema = z.enum(["Standalone", "PnpmWorkspace", "Turborepo", "Nx"]);
export type NextWorkspaceKind = z.infer<typeof nextWorkspaceKindSchema>;

export const nextApplicationRouterSchema = z.enum(["AppRouter", "PagesRouter"]);
export type NextApplicationRouter = z.infer<typeof nextApplicationRouterSchema>;

export const previewSurfaceSchema = z.object({
    routePath: z.string().regex(/^\/[a-z0-9][a-z0-9-]{0,48}$/),
    generatedFiles: z.array(z.string().min(1)).min(1),
    router: nextApplicationRouterSchema,
});
export type PreviewSurface = z.infer<typeof previewSurfaceSchema>;

export const createNextPreviewSurfaceInputSchema = z.object({
    workspaceRoot: z.string().min(1),
    applicationPath: z.string().min(1),
    routeSegment: z.string().regex(SAFE_ID),
    router: nextApplicationRouterSchema,
});
export type CreateNextPreviewSurfaceInput = z.infer<typeof createNextPreviewSurfaceInputSchema>;

export const removeNextPreviewSurfaceInputSchema = z.object({
    surface: previewSurfaceSchema,
});
export type RemoveNextPreviewSurfaceInput = z.infer<typeof removeNextPreviewSurfaceInputSchema>;

export const nextApplicationCandidateSchema = z.object({
    applicationPath: z.string().min(1),
    packageName: z.string().min(1).nullable(),
    router: nextApplicationRouterSchema,
    hasPagesDirectory: z.boolean(),
});
export type NextApplicationCandidate = z.infer<typeof nextApplicationCandidateSchema>;

export const nextWorkspaceInspectionInputSchema = z.object({
    workspaceRoot: z.string().min(1),
    changedPaths: z.array(z.string()).default([]),
});
export type NextWorkspaceInspectionInput = z.infer<typeof nextWorkspaceInspectionInputSchema>;

export const nextWorkspaceInspectionSchema = z.object({
    workspaceKind: nextWorkspaceKindSchema,
    packageManager: packageManagerSchema.nullable(),
    applications: z.array(nextApplicationCandidateSchema),
    changedApplicationPaths: z.array(z.string().min(1)),
});
export type NextWorkspaceInspection = z.infer<typeof nextWorkspaceInspectionSchema>;

export const frameworkSchema = z.enum(["NextAppRouter", "NextPagesRouter"]);
export type Framework = z.infer<typeof frameworkSchema>;

export const shotOutcomeSchema = z.enum(["Rendered", "Added", "Removed", "Unavailable"]);
export type ShotOutcome = z.infer<typeof shotOutcomeSchema>;

export const viewportSchema = z.object({
    id: z.string().regex(SAFE_ID),
    label: z.string().min(1).max(40),
    width: z.number().int().min(240).max(3840),
    height: z.number().int().min(240).max(3840),
});
export type Viewport = z.infer<typeof viewportSchema>;

export const harnessManifestSchema = z.object({
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

export const detectInputSchema = z.object({
    workspaceRoot: z.string().min(1),
    changedPaths: z.array(z.string()).default([]),
});
export type DetectInput = z.infer<typeof detectInputSchema>;

export const detectOutputSchema = z.object({
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
export type DetectOutput = z.infer<typeof detectOutputSchema>;

export const scaffoldInputSchema = z.object({
    workspaceRoot: z.string().min(1),
    detect: detectOutputSchema,
});
export type ScaffoldInput = z.infer<typeof scaffoldInputSchema>;

export const scaffoldOutputSchema = z.object({
    ok: z.boolean(),
    routeFiles: z.array(z.string()),
    warnings: z.array(z.string()),
});
export type ScaffoldOutput = z.infer<typeof scaffoldOutputSchema>;

export const checkProblemSchema = z.enum([
    "HttpError",
    "Redirected",
    "MissingRoot",
    "EmptyRoot",
    "PageError",
    "ConsoleError",
    "NextErrorOverlay",
    "Timeout",
]);
export type CheckProblem = z.infer<typeof checkProblemSchema>;

export const checkInputSchema = z.object({
    baseUrl: z.string().min(1),
    routePath: previewSurfaceSchema.shape.routePath,
    workspaceRoot: z.string().min(1),
    nextAppDir: z.string().min(1),
    targetIds: z.array(z.string()).optional(),
    navigationTimeoutMs: z.number().int().min(1000).max(180_000).default(45_000),
});
export type CheckInput = z.infer<typeof checkInputSchema>;

export const checkResultSchema = z.object({
    targetId: z.string(),
    stateId: z.string(),
    url: z.string(),
    ok: z.boolean(),
    httpStatus: z.number().int().nullable(),
    problem: checkProblemSchema.nullable(),
    detail: z.string().nullable(),
});
export type CheckResult = z.infer<typeof checkResultSchema>;

export const checkOutputSchema = z.object({
    ok: z.boolean(),
    results: z.array(checkResultSchema),
    warnings: z.array(z.string()),
});
export type CheckOutput = z.infer<typeof checkOutputSchema>;

export const revisionSideSchema = z.enum(["head", "base"]);
export type RevisionSide = z.infer<typeof revisionSideSchema>;

export const captureInputSchema = z.object({
    url: z.string().min(1),
    routePath: previewSurfaceSchema.shape.routePath,
    side: revisionSideSchema,
    workspaceRoot: z.string().min(1),
    nextAppDir: z.string().min(1),
    outputDir: z.string().min(1),
    viewports: z.array(viewportSchema).min(1).max(4),
    frozenNowMs: z.number().int(),
    randomSeed: z.number().int(),
    navigationTimeoutMs: z.number().int().min(1000).max(180_000).default(45_000),
    warmupTimeoutMs: z.number().int().min(1000).max(300_000).default(120_000),
    settleMs: z.number().int().min(0).max(5_000).default(250),
    maxShots: z.number().int().min(1).max(400).default(48),
});
export type CaptureInput = z.infer<typeof captureInputSchema>;

export const captureResultSchema = z.object({
    targetId: z.string(),
    stateId: z.string(),
    viewportId: z.string(),
    status: z.enum(["ok", "failed"]),
    file: z.string().nullable(),
    error: z.string().nullable(),
});
export type CaptureResult = z.infer<typeof captureResultSchema>;

export const captureOutputSchema = z.object({
    ok: z.boolean(),
    side: revisionSideSchema,
    captures: z.array(captureResultSchema),
    warnings: z.array(z.string()),
});
export type CaptureOutput = z.infer<typeof captureOutputSchema>;

export const capturedSideSchema = z.object({
    status: z.enum(["ok", "failed", "absent"]),
    file: z.string().nullable(),
    error: z.string().nullable(),
});
export type CapturedSide = z.infer<typeof capturedSideSchema>;

export const pairInputSchema = z.object({
    head: z.array(captureResultSchema),
    base: z.array(captureResultSchema),
});
export type PairInput = z.infer<typeof pairInputSchema>;

export const pairResultSchema = z.object({
    targetId: z.string(),
    stateId: z.string(),
    viewportId: z.string(),
    outcome: shotOutcomeSchema,
    base: capturedSideSchema,
    head: capturedSideSchema,
    error: z.string().nullable(),
});
export type PairResult = z.infer<typeof pairResultSchema>;

export const pairOutputSchema = z.object({
    ok: z.boolean(),
    shots: z.array(pairResultSchema),
    warnings: z.array(z.string()),
});
export type PairOutput = z.infer<typeof pairOutputSchema>;

export const doctorOutputSchema = z.object({
    ok: z.boolean(),
    chromiumVersion: z.string().nullable(),
    chromiumPath: z.string().nullable(),
    error: z.string().nullable(),
});
export type DoctorOutput = z.infer<typeof doctorOutputSchema>;

export const HARNESS_DIR = "matcha_preview";
export const HARNESS_ROOT_ATTRIBUTE = "data-matcha-harness-root";
export const PROBE_TARGET_ID = "matcha-probe";

export function preview_url(
    baseUrl: string,
    routePath: string,
    targetId: string,
    stateId: string,
): string {
    return `${baseUrl.replace(/\/+$/, "")}${routePath}/${targetId}?state=${encodeURIComponent(stateId)}`;
}
