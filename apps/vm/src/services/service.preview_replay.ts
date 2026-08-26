import { posix } from "node:path";

import type {
    ProductDiffReplayDataPolicy,
    ReplayFidelity,
    ReplayRevisionEvidence,
} from "@trymatcha/types";
import type { Sandbox } from "e2b";
import { z } from "zod";

import type {
    ProductDiffRevision,
    ProductDiffRunningReplay,
} from "./product_diff/adapter.contract";
import PreviewRunner, {
    replayEvidenceSchema,
    type ReplayReviewPlan,
    type ReplayScenario,
    type ReplaySurface,
} from "./service.preview_runner";

const replayCaptureSchema = z
    .object({
        revision: z.enum(["head", "base"]),
        applicationId: z.string().min(1).max(49),
        surfaceId: z.string().min(1).max(49),
        stateId: z.string().min(1).max(49),
        viewportId: z.string().min(1).max(49),
        artifactKey: z.string().min(1).max(500).nullable(),
        fidelity: z.enum(["Verified", "Partial", "Unavailable"]),
        diagnostics: z.array(z.string().max(300)).max(20),
        resourceCount: z.number().int().min(0).max(10_000),
        packageBytes: z.number().int().min(0).max(500_000_000),
        captureDurationMs: z.number().int().min(0).max(3_600_000),
        validationOutcome: z.enum(["Verified", "Partial", "Unavailable"]),
        evidence: replayEvidenceSchema.default({
            scenarios: [],
            dom: null,
            accessibility: null,
            consoleDiagnostics: [],
            failedRequestDiagnostics: [],
        }),
    })
    .strict();

export interface PreviewReplayCapture {
    revision: ProductDiffRevision;
    applicationId: string;
    surfaceId: string;
    stateId: string;
    viewportId: string;
    artifactKey: string | null;
    fidelity: ReplayFidelity;
    diagnostics: string[];
    resourceCount: number;
    packageBytes: number;
    captureDurationMs: number;
    validationOutcome: ReplayFidelity;
    evidence?: ReplayRevisionEvidence;
}

export interface PreviewReplayCaptureInput {
    revision: ProductDiffRevision;
    preview: ProductDiffRunningReplay;
    plan: ReplayReviewPlan;
    artifactRoot: string;
    dataPolicy?: ProductDiffReplayDataPolicy;
}

function application_matches(preview: ProductDiffRunningReplay, applicationPath: string): boolean {
    const normalizedRoot = posix.resolve(preview.applicationPath);
    return applicationPath === "." || normalizedRoot.endsWith(`/${applicationPath}`);
}

function surface_url(
    preview: ProductDiffRunningReplay,
    surface: ReplaySurface,
    stateId: string,
): string {
    const path =
        surface.entry.kind === "route"
            ? surface.entry.path
            : `${preview.surfacePath}/${encodeURIComponent(surface.entry.targetId)}?state=${encodeURIComponent(stateId)}`;
    return new URL(path, `${preview.url}/`).toString();
}

function scenario_for(
    surface: ReplaySurface,
    state: ReplaySurface["states"][number],
): { scenario: ReplayScenario; scenarios: ReplayScenario[] } | null {
    const actions = state.scenarios.flatMap((scenario) => scenario.actions);
    if (actions.length > 12) return null;
    const scenario = {
        id: `${surface.id}-${state.id}`.slice(0, 49),
        label: `${surface.label}: ${state.label}`.slice(0, 300),
        actions: [],
    };
    return {
        scenario,
        scenarios: state.scenarios.length > 0 ? state.scenarios : [scenario],
    };
}

function unavailable(
    revision: ProductDiffRevision,
    applicationId: string,
    surfaceId: string,
    stateId: string,
    viewportId: string,
    diagnostic: string,
): PreviewReplayCapture {
    return {
        revision,
        applicationId,
        surfaceId,
        stateId,
        viewportId,
        artifactKey: null,
        fidelity: "Unavailable",
        diagnostics: [diagnostic],
        resourceCount: 0,
        packageBytes: 0,
        captureDurationMs: 0,
        validationOutcome: "Unavailable",
        evidence: {
            scenarios: [],
            dom: null,
            accessibility: null,
            consoleDiagnostics: [],
            failedRequestDiagnostics: [],
        },
    };
}

export default class PreviewReplay {
    static unavailable(
        revision: ProductDiffRevision,
        plan: ReplayReviewPlan,
        diagnostic: string,
    ): PreviewReplayCapture[] {
        return plan.surfaces.flatMap((surface) =>
            surface.states.flatMap((state) =>
                surface.viewports.map((viewport) =>
                    unavailable(
                        revision,
                        surface.applicationId,
                        surface.id,
                        state.id,
                        viewport.id,
                        diagnostic,
                    ),
                ),
            ),
        );
    }

    static async capture(
        sandbox: Sandbox,
        input: PreviewReplayCaptureInput,
    ): Promise<PreviewReplayCapture[]> {
        const captures: PreviewReplayCapture[] = [];

        for (const surface of input.plan.surfaces) {
            const application = input.plan.applications.find(
                (candidate) => candidate.id === surface.applicationId,
            );
            for (const state of surface.states) {
                for (const viewport of surface.viewports) {
                    const coordinates = [
                        surface.applicationId,
                        surface.id,
                        state.id,
                        viewport.id,
                        input.revision,
                    ];
                    if (
                        !application ||
                        !application_matches(input.preview, application.applicationPath)
                    ) {
                        captures.push(
                            unavailable(
                                input.revision,
                                surface.applicationId,
                                surface.id,
                                state.id,
                                viewport.id,
                                "surface application is unavailable in this replay workspace",
                            ),
                        );
                        continue;
                    }
                    const scenarioRequest = scenario_for(surface, state);
                    if (!scenarioRequest) {
                        captures.push(
                            unavailable(
                                input.revision,
                                surface.applicationId,
                                surface.id,
                                state.id,
                                viewport.id,
                                "surface scenarios exceed the replay action limit",
                            ),
                        );
                        continue;
                    }

                    try {
                        const artifactRoot = posix.join(input.artifactRoot, ...coordinates);
                        const result = await PreviewRunner.replay_capture(sandbox, {
                            url: surface_url(input.preview, surface, state.id),
                            artifactRoot,
                            scenario: scenarioRequest.scenario,
                            scenarios: scenarioRequest.scenarios,
                            viewport: { width: viewport.width, height: viewport.height },
                            browserAssets: input.preview.browserAssets,
                            dataPolicy: input.dataPolicy,
                        });
                        captures.push({
                            revision: input.revision,
                            applicationId: surface.applicationId,
                            surfaceId: surface.id,
                            stateId: state.id,
                            viewportId: viewport.id,
                            artifactKey: posix.join("replay", ...coordinates, result.artifactKey),
                            fidelity: result.fidelity,
                            diagnostics: result.diagnostics,
                            resourceCount: result.resourceCount,
                            packageBytes: result.packageBytes,
                            captureDurationMs: result.captureDurationMs,
                            validationOutcome: result.validationOutcome,
                            evidence: result.evidence,
                        });
                    } catch {
                        captures.push(
                            unavailable(
                                input.revision,
                                surface.applicationId,
                                surface.id,
                                state.id,
                                viewport.id,
                                "replay capture command was unavailable",
                            ),
                        );
                    }
                }
            }
        }

        return captures;
    }

    static validate(
        revision: ProductDiffRevision,
        captures: PreviewReplayCapture[],
    ): PreviewReplayCapture[] {
        return z
            .array(replayCaptureSchema)
            .max(288)
            .parse(captures.map((capture) => ({ ...capture, revision })));
    }
}
