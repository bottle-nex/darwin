import { lstatSync, readFileSync } from "node:fs";

import type { ReplayScenario } from "../contract";
import { replayScenarioSchema } from "../contract";
import type {
    ProductDiffManifestV4,
    ReplayRevisionEvidence,
} from "../../../types/product-diff/product-diff.contract";
import { z } from "zod";
import { ReplayArtifactWriter } from "./artifact_writer";
import {
    recordReplaySurface,
    type ReplayRecorderOptions,
    type ReplaySurfaceRecording,
} from "./resource_recorder";
import { validateReplayArtifact, type ReplayValidationResult } from "./offline_validator";

export interface ReplayCaptureInput {
    url: string;
    artifactRoot: string;
    scenario: ReplayScenario;
    scenarios?: ReplayScenario[];
    policy?: ReplayRecorderOptions["policy"];
    viewport?: { width: number; height: number };
    framework?: "NextAppRouter" | "NextPagesRouter";
    applications?: ProductDiffManifestV4["applications"];
    surfaces?: ProductDiffManifestV4["surfaces"];
    warnings?: string[];
    browserAssets?: ReplayCaptureBrowserAsset[];
}

export interface ReplayCaptureBrowserAsset {
    requestPath: string;
    sourcePath: string;
    contentType: string;
}

export interface ReplayCaptureResult {
    artifactKey: string;
    fidelity: "Verified" | "Partial" | "Unavailable";
    diagnostics: string[];
    resourceCount: number;
    packageBytes: number;
    captureDurationMs: number;
    validationOutcome: "Verified" | "Partial" | "Unavailable";
    recording: ReplaySurfaceRecording;
    validation: ReplayValidationResult;
    evidence: ReplayRevisionEvidence;
}

const replayCapturePolicySchema = z
    .object({
        staticOrigins: z.array(z.string().url()).max(20).optional(),
        sameOriginJsonPaths: z
            .array(
                z
                    .string()
                    .min(2)
                    .max(240)
                    .regex(/^\/(?!\*)(?:[A-Za-z0-9._~-]+\/)*(?:[A-Za-z0-9._~-]+|\*)$/),
            )
            .max(20)
            .optional(),
        allowedQueryParameters: z
            .record(z.string().max(80), z.array(z.string().max(300)).max(20))
            .optional(),
        maxResponseBytes: z.number().int().min(1).max(50_000_000).optional(),
    })
    .strict();

const replayCaptureBrowserAssetSchema = z
    .object({
        requestPath: z
            .string()
            .min(1)
            .max(500)
            .startsWith("/")
            .refine(
                (value) => !value.includes("..") && !value.includes("?") && !value.includes("#"),
            ),
        sourcePath: z.string().min(1).max(500).startsWith("/"),
        contentType: z
            .string()
            .min(1)
            .max(200)
            .regex(/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i),
    })
    .strict();

export const replayCaptureInputSchema = z
    .object({
        url: z
            .string()
            .url()
            .refine((value) => ["http:", "https:"].includes(new URL(value).protocol)),
        artifactRoot: z.string().min(1).max(500),
        scenario: replayScenarioSchema,
        scenarios: z.array(replayScenarioSchema).min(1).max(12).optional(),
        policy: replayCapturePolicySchema.optional(),
        viewport: z
            .object({
                width: z.number().int().min(240).max(3840),
                height: z.number().int().min(240).max(3840),
            })
            .strict()
            .optional(),
        browserAssets: z.array(replayCaptureBrowserAssetSchema).max(10_000).optional(),
    })
    .strict()
    .refine((input) => input.scenarios === undefined || input.scenario.actions.length === 0, {
        message: "a compatibility scenario cannot contain actions when scenarios are supplied",
        path: ["scenario"],
    })
    .refine(
        (input) =>
            (input.scenarios ?? [input.scenario]).reduce(
                (total, scenario) => total + scenario.actions.length,
                0,
            ) <= 12,
        {
            message: "replay coordinate action limit exceeded",
            path: ["scenarios"],
        },
    );

function recording_partial(recording: ReplaySurfaceRecording): boolean {
    return (
        recording.actions.some((action) => action.outcome === "Failed") ||
        recording.pageErrors.length > 0 ||
        recording.consoleErrors.length > 0 ||
        recording.failedRequests.length > 0
    );
}

function browser_asset_resource_type(contentType: string): string {
    if (contentType === "text/css") return "stylesheet";
    if (contentType.includes("javascript")) return "script";
    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("font/")) return "font";
    if (contentType === "application/wasm") return "wasm";
    if (contentType.includes("manifest")) return "manifest";
    return "other";
}

export async function writeReplayBrowserAssets(
    writer: ReplayArtifactWriter,
    applicationUrl: string,
    assets: ReplayCaptureBrowserAsset[],
    maximumBytes: number,
): Promise<void> {
    for (const asset of assets) {
        const file = lstatSync(asset.sourcePath);
        if (!file.isFile() || file.isSymbolicLink() || file.size > maximumBytes) {
            throw new Error("replay browser asset is unavailable");
        }
        await writer.writeResource({
            request: {
                url: new URL(asset.requestPath, applicationUrl).toString(),
                method: "GET",
                resourceType: browser_asset_resource_type(asset.contentType),
                responseContentType: asset.contentType,
                variantHeaders: {},
            },
            responseHeaders: { "content-type": asset.contentType },
            body: readFileSync(asset.sourcePath),
            kind: "asset",
        });
    }
}

export async function runReplayCapture(input: ReplayCaptureInput): Promise<ReplayCaptureResult> {
    const captureStartedAt = Date.now();
    const scenarios = input.scenarios ?? [input.scenario];
    const combinedScenario = replayScenarioSchema.parse({
        id: input.scenario.id,
        label: input.scenario.label,
        actions: scenarios.flatMap((scenario) => scenario.actions),
    });
    const recording = await recordReplaySurface(input.url, combinedScenario, {
        policy: input.policy,
        viewport: input.viewport,
    });
    const writer = new ReplayArtifactWriter(input.artifactRoot, {
        allowedQueryParameters: input.policy?.allowedQueryParameters,
    });
    for (const resource of recording.resources) {
        await writer.writeResource({
            request: {
                url: resource.url,
                method: resource.method,
                resourceType: resource.resourceType,
                responseContentType: resource.responseContentType,
                variantHeaders: resource.variantHeaders,
            },
            responseHeaders: resource.responseHeaders,
            body: resource.body,
            kind: resource.kind === "response" ? "response" : "asset",
            responseStatus: resource.responseStatus,
            responseStatusText: resource.responseStatusText,
            redirectLocation: resource.redirectLocation,
        });
    }
    await writeReplayBrowserAssets(
        writer,
        input.url,
        input.browserAssets ?? [],
        input.policy?.maxResponseBytes ?? 5_000_000,
    );
    const artifact = await writer.writeManifest({
        version: 4,
        framework: input.framework ?? "NextAppRouter",
        applications: input.applications ?? [],
        surfaces: input.surfaces ?? [],
        warnings: input.warnings ?? [],
    });
    const validation = await validateReplayArtifact(input.artifactRoot, scenarios);
    const partial = recording_partial(recording);
    return {
        artifactKey: artifact.objectKey,
        fidelity: partial && validation.fidelity === "Verified" ? "Partial" : validation.fidelity,
        diagnostics: partial
            ? [...validation.diagnostics, "recording encountered runtime differences"]
            : validation.diagnostics,
        resourceCount: writer.resourceCount,
        packageBytes: writer.packageBytes,
        captureDurationMs: Date.now() - captureStartedAt,
        validationOutcome: validation.fidelity,
        recording,
        validation,
        evidence: {
            scenarios: validation.scenarios,
            dom: validation.dom,
            accessibility: validation.accessibility,
            consoleDiagnostics: validation.consoleErrors,
            failedRequestDiagnostics: [
                ...new Set([...validation.failedRequests, ...validation.unexpectedRequests]),
            ].slice(0, 20),
        },
    };
}
