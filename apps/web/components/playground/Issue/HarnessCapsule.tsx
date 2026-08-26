"use client";
import { useGetIssueConfig, useSetIssueConfig } from "@/hooks/issues/useIssueConfig";
import {
    EFFORT_OPTIONS,
    HARNESS_MODELS,
    HARNESS_OPTIONS,
    HARNESS_SUPPORTS_EFFORT,
} from "@/types/harness.type";
import type { Effort, Harness } from "@/types/harness.type";
import Capsule, { type CapsuleOption } from "./Capsule";
import { STACKED_CAPSULE } from "./issueHelpers";

const FROZEN_STATUSES = ["InProgress", "InReview", "Done", "Failed", "Cancelled"];

const HARNESS_CAPSULE_OPTIONS: CapsuleOption[] = HARNESS_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
}));

const EFFORT_CAPSULE_OPTIONS: CapsuleOption[] = EFFORT_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
}));

export default function HarnessCapsules({ issueId, status }: { issueId: string; status: string }) {
    const { data } = useGetIssueConfig(issueId);
    const setConfig = useSetIssueConfig();

    const frozen = FROZEN_STATUSES.includes(status);
    const current = data?.config;
    const harness = current?.harness ?? "Claude";
    const model = current?.model ?? undefined;
    const effort = current?.effort ?? undefined;
    const supportsEffort = HARNESS_SUPPORTS_EFFORT[harness];
    const modelOptions: CapsuleOption[] = HARNESS_MODELS[harness].map((m) => ({
        value: m,
        label: m,
    }));

    function changeHarness(next: string) {
        const nextHarness = next as Harness;
        const nextModel = HARNESS_MODELS[nextHarness].includes(model ?? "")
            ? (model as string)
            : HARNESS_MODELS[nextHarness][0];
        if (!nextModel) return;
        setConfig.mutate({
            issueId,
            harness: nextHarness,
            model: nextModel,
            ...(HARNESS_SUPPORTS_EFFORT[nextHarness] && effort ? { effort } : {}),
        });
    }

    function changeModel(next: string) {
        setConfig.mutate({
            issueId,
            harness,
            model: next,
            ...(supportsEffort && effort ? { effort } : {}),
        });
    }

    function changeEffort(next: string) {
        if (!model) return;
        setConfig.mutate({ issueId, harness, model, effort: next as Effort });
    }

    return (
        <>
            <Capsule
                type="dropdown"
                options={HARNESS_CAPSULE_OPTIONS}
                value={harness}
                onChange={changeHarness}
                disabled={frozen}
                className={STACKED_CAPSULE}
            />
            <Capsule
                type="dropdown"
                options={modelOptions}
                value={model}
                onChange={changeModel}
                disabled={frozen}
                className={STACKED_CAPSULE}
                placeholder="No model selected"
            />
            {supportsEffort && (
                <Capsule
                    type="dropdown"
                    options={EFFORT_CAPSULE_OPTIONS}
                    value={effort}
                    onChange={changeEffort}
                    disabled={frozen || !model}
                    className={STACKED_CAPSULE}
                    placeholder="No effort selected"
                />
            )}
        </>
    );
}
