import type {
    CaptureResult,
    CapturedSide,
    PairInput,
    PairOutput,
    PairResult,
    ShotOutcome,
} from "./contract";

function slot_key(shot: { targetId: string; stateId: string; viewportId: string }): string {
    return `${shot.targetId}/${shot.stateId}/${shot.viewportId}`;
}

function side_of(capture: CaptureResult | undefined): CapturedSide {
    if (!capture) return { status: "absent", file: null, error: null };
    return { status: capture.status, file: capture.file, error: capture.error };
}

function outcome_for(base: CapturedSide, head: CapturedSide): ShotOutcome {
    if (head.status === "failed" || base.status === "failed") return "Unavailable";
    if (head.status === "ok" && base.status === "ok") return "Rendered";
    if (head.status === "ok" && base.status === "absent") return "Added";
    if (base.status === "ok" && head.status === "absent") return "Removed";
    return "Unavailable";
}

export function pair(input: PairInput): PairOutput {
    const headByKey = new Map(input.head.map((shot) => [slot_key(shot), shot]));
    const baseByKey = new Map(input.base.map((shot) => [slot_key(shot), shot]));
    const keys = [...new Set([...headByKey.keys(), ...baseByKey.keys()])];
    const warnings: string[] = [];

    if (input.base.length === 0) {
        warnings.push(
            "the base revision produced no screenshots, so every target is reported as added",
        );
    }

    const shots: PairResult[] = keys.map((key) => {
        const [targetId, stateId, viewportId] = key.split("/") as [string, string, string];
        const head = side_of(headByKey.get(key));
        const base = side_of(baseByKey.get(key));

        return {
            targetId,
            stateId,
            viewportId,
            outcome: outcome_for(base, head),
            base,
            head,
            error: head.error ?? base.error,
        };
    });

    return {
        ok: shots.length > 0 && shots.every((shot) => shot.outcome !== "Unavailable"),
        shots,
        warnings,
    };
}
