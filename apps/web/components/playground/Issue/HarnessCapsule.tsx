"use client";
import type { Effort, Harness } from "@/types/harness.type";
import { EFFORT_OPTIONS, HARNESS_OPTIONS } from "@/types/harness.type";

import Capsule, { type CapsuleOption } from "./Capsule";
import ExecutionModeCapsule from "./ExecutionModeCapsule";
import { STACKED_CAPSULE } from "./issueHelpers";
import type { HarnessConfigState } from "./useIssueForm";

const HARNESS_CAPSULE_OPTIONS: CapsuleOption[] = HARNESS_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
}));

const EFFORT_CAPSULE_OPTIONS: CapsuleOption[] = EFFORT_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
}));

export default function HarnessCapsules({ harnessConfig }: { harnessConfig: HarnessConfigState }) {
    const {
        harness,
        model,
        effort,
        modelOptions,
        supportsEffort,
        frozen,
        executionMode,
        setHarness,
        setModel,
        setEffort,
        setExecutionMode,
    } = harnessConfig;

    const modelCapsuleOptions: CapsuleOption[] = modelOptions.map((m) => ({ value: m, label: m }));

    return (
        <>
            <Capsule
                type="dropdown"
                options={HARNESS_CAPSULE_OPTIONS}
                value={harness}
                onChange={(next) => setHarness(next as Harness)}
                disabled={frozen}
                className={STACKED_CAPSULE}
            />
            <Capsule
                type="dropdown"
                options={modelCapsuleOptions}
                value={model ?? undefined}
                onChange={setModel}
                disabled={frozen}
                className={STACKED_CAPSULE}
                placeholder="No model selected"
            />
            <ExecutionModeCapsule
                value={executionMode}
                onChange={setExecutionMode}
                disabled={frozen}
                className={STACKED_CAPSULE}
            />
            {supportsEffort && (
                <Capsule
                    type="dropdown"
                    options={EFFORT_CAPSULE_OPTIONS}
                    value={effort ?? undefined}
                    onChange={(next) => setEffort(next as Effort)}
                    disabled={frozen || !model}
                    className={STACKED_CAPSULE}
                    placeholder="No effort selected"
                />
            )}
        </>
    );
}
