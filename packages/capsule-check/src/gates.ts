import { meaningful_diagnostics } from "@trydarwin/types";

export type CapsuleFidelity = "Verified" | "Partial" | "Failed";

export const MIN_VISIBLE_HEIGHT_PX = 24;
export const MOUNT_WAIT_MS = 5_000;
export const PAGE_TIMEOUT_MS = 15_000;

const MAX_DIAGNOSTICS = 10;
const MAX_DIAGNOSTIC_CHARS = 300;

export interface PageObservation {
    mounted: boolean;
    timedOut: boolean;
    pageErrors: string[];
    consoleErrors: string[];
    renderedHeight: number;
    visibleTextLength: number;
    imageCount: number;
}

export interface GateResult {
    capsuleId: string;
    fidelity: CapsuleFidelity;
    diagnostics: string[];
}

function trim(diagnostics: string[]): string[] {
    return diagnostics
        .slice(0, MAX_DIAGNOSTICS)
        .map((entry) => entry.slice(0, MAX_DIAGNOSTIC_CHARS));
}

function painted_something(observation: PageObservation): boolean {
    if (observation.renderedHeight < MIN_VISIBLE_HEIGHT_PX) return false;
    return observation.visibleTextLength > 0 || observation.imageCount > 0;
}

export function grade_page(capsule_id: string, observation: PageObservation): GateResult {
    const failed = (diagnostics: string[]): GateResult => ({
        capsuleId: capsule_id,
        fidelity: "Failed",
        diagnostics: trim(diagnostics),
    });

    if (observation.pageErrors.length > 0) return failed(observation.pageErrors);
    if (observation.timedOut) {
        return failed([
            `the page timed out after ${PAGE_TIMEOUT_MS}ms`,
            ...observation.consoleErrors,
        ]);
    }
    if (!observation.mounted) {
        return failed([
            `the component never mounted within ${MOUNT_WAIT_MS}ms`,
            ...observation.consoleErrors,
        ]);
    }
    if (!painted_something(observation)) {
        return failed([
            `the component mounted but rendered nothing visible (height ${observation.renderedHeight}px, ${observation.visibleTextLength} characters, ${observation.imageCount} images)`,
            ...observation.consoleErrors,
        ]);
    }

    const noise = meaningful_diagnostics(observation.consoleErrors);
    if (noise.length > 0) {
        return { capsuleId: capsule_id, fidelity: "Partial", diagnostics: trim(noise) };
    }

    return { capsuleId: capsule_id, fidelity: "Verified", diagnostics: [] };
}
