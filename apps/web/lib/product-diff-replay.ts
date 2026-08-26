import type {
    ProductDiffManifestV4,
    ReplayApplicationResult,
    ReplayRevisionArtifact,
    ReplayStateResult,
    ReplaySurfaceResult,
    ReplayViewportResult,
} from "@trymatcha/types";

export const PRODUCT_DIFF_REPLAY_IFRAME_SANDBOX = "allow-scripts allow-same-origin allow-forms";

export type ReplaySelection = {
    applicationId: string;
    surfaceId: string;
    stateId: string;
    viewportId: string;
};

export type ReplayEvidenceSection = {
    label: string;
    values: string[];
};

export function replay_evidence_sections(
    artifact: ReplayRevisionArtifact,
): ReplayEvidenceSection[] {
    const evidence = artifact.evidence;
    if (!evidence) return [];
    const sections: ReplayEvidenceSection[] = [];
    if (evidence.scenarios.length > 0) {
        sections.push({
            label: "Scenarios",
            values: evidence.scenarios.map((scenario) => `${scenario.label} · ${scenario.outcome}`),
        });
    }
    if (evidence.dom) {
        sections.push({
            label: "DOM",
            values: [
                `${evidence.dom.elementCount} elements · ${evidence.dom.interactiveElementCount} interactive · ${evidence.dom.visibleTextLength} visible characters`,
            ],
        });
    }
    if (evidence.accessibility) {
        sections.push({
            label: "Accessibility",
            values: [
                `${evidence.accessibility.landmarkCount} landmarks · ${evidence.accessibility.headingCount} headings · ${evidence.accessibility.labeledControlCount} labeled controls · ${evidence.accessibility.unlabeledControlCount} unlabeled controls`,
            ],
        });
    }
    if (evidence.consoleDiagnostics.length > 0) {
        sections.push({ label: "Console", values: evidence.consoleDiagnostics });
    }
    if (evidence.failedRequestDiagnostics.length > 0) {
        sections.push({ label: "Failed requests", values: evidence.failedRequestDiagnostics });
    }
    return sections;
}

export function select_replay_application(
    manifest: ProductDiffManifestV4,
    applicationId: string,
): ReplayApplicationResult | undefined {
    return manifest.applications.find((application) => application.id === applicationId);
}

export function select_replay_surface(
    manifest: ProductDiffManifestV4,
    selection: Pick<ReplaySelection, "applicationId" | "surfaceId">,
): ReplaySurfaceResult | undefined {
    return manifest.surfaces.find(
        (surface) =>
            surface.applicationId === selection.applicationId && surface.id === selection.surfaceId,
    );
}

export function select_replay_state(
    surface: ReplaySurfaceResult | undefined,
    stateId: string,
): ReplayStateResult | undefined {
    return surface?.states.find((state) => state.id === stateId);
}

export function select_replay_viewport(
    state: ReplayStateResult | undefined,
    viewportId: string,
): ReplayViewportResult | undefined {
    return state?.viewports.find((viewport) => viewport.id === viewportId);
}

export function select_replay_artifacts(
    manifest: ProductDiffManifestV4,
    selection: ReplaySelection,
): { base: ReplayRevisionArtifact; head: ReplayRevisionArtifact } | undefined {
    const surface = select_replay_surface(manifest, selection);
    const state = select_replay_state(surface, selection.stateId);
    const viewport = select_replay_viewport(state, selection.viewportId);
    if (!viewport) return undefined;
    return { base: viewport.base, head: viewport.head };
}

export function default_replay_selection(
    manifest: ProductDiffManifestV4,
): ReplaySelection | undefined {
    const surface = manifest.surfaces.find((candidate) =>
        candidate.states.some((state) => state.viewports.length > 0),
    );
    const state = surface?.states.find((candidate) => candidate.viewports.length > 0);
    const viewport = state?.viewports[0];
    if (!surface || !state || !viewport) return undefined;
    return {
        applicationId: surface.applicationId,
        surfaceId: surface.id,
        stateId: state.id,
        viewportId: viewport.id,
    };
}

export function has_launchable_replay_surface(manifest: ProductDiffManifestV4): boolean {
    return manifest.surfaces.some((surface) =>
        surface.states.some((state) =>
            state.viewports.some(
                (viewport) =>
                    Boolean(viewport.base.artifactKey) || Boolean(viewport.head.artifactKey),
            ),
        ),
    );
}
