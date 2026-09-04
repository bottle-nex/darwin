"use client";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import SelectField from "@/components/ui/SelectField";
import NoResource from "@/components/utility/NoResource";
import ProjectsGlyph from "@/components/utility/ProjectsGlyph";
import { useGetProjectConfig } from "@/hooks/project/useGetProjectConfig";
import { useUpdateProjectConfig } from "@/hooks/project/useUpdateProjectConfig";
import {
    type Effort,
    EFFORT_OPTIONS,
    type Harness,
    HARNESS_MODELS,
    HARNESS_OPTIONS,
    HARNESS_SUPPORTS_EFFORT,
} from "@/types/harness.type";
import { EXECUTION_MODE_OPTIONS, type ExecutionMode } from "@/types/project";

import SettingsRow from "./SettingsRow";
import SettingsTilePicker from "./SettingsTilePicker";
import SettingsUtilityCard from "./SettingsUtilityCard";

interface AIHarnessSettingsSectionProps {
    projectId: string;
    isAdmin: boolean;
}

export default function AIHarnessSettingsSection({
    projectId,
    isAdmin,
}: AIHarnessSettingsSectionProps) {
    const { data: config } = useGetProjectConfig(projectId);
    const update = useUpdateProjectConfig();

    const [harnessDraft, setHarnessDraft] = useState<Harness | null>(null);
    const [modelDraft, setModelDraft] = useState<string | null>(null);
    const [effortDraft, setEffortDraft] = useState<Effort | null>(null);
    const [modeDraft, setModeDraft] = useState<ExecutionMode | null>(null);

    if (!isAdmin) {
        return (
            <NoResource
                className="mt-12"
                icon={<ProjectsGlyph className="size-24" />}
                title="You don't have the access to the AI harness setup"
                description="You've to be an admin of this Project to setup or update the default AI Harness, model, and effort"
            />
        );
    }

    const savedHarness = config?.harness ?? "Claude";
    const harness = harnessDraft ?? savedHarness;
    const availableModels = HARNESS_MODELS[harness];
    const supportsEffort = HARNESS_SUPPORTS_EFFORT[harness];

    const savedModel = config?.defaultModel ?? null;
    const model = modelDraft ?? (harnessDraft ? null : savedModel);

    const savedEffort = config?.defaultEffort ?? null;
    const effort = effortDraft ?? (harnessDraft ? null : savedEffort);

    const savedMode = config?.executionMode ?? "Autonomous";
    const mode = modeDraft ?? savedMode;

    const dirty =
        harness !== savedHarness ||
        model !== savedModel ||
        mode !== savedMode ||
        effort !== (supportsEffort ? savedEffort : null);
    const canSave = dirty && Boolean(model) && !update.isPending;

    function pickHarness(next: Harness) {
        setHarnessDraft(next);
        setModelDraft(null);
        setEffortDraft(null);
    }

    function save() {
        if (!canSave || !model) return;
        update.mutate({
            projectId,
            harness,
            default_model: model,
            execution_mode: mode,
            ...(supportsEffort && effort ? { default_effort: effort } : {}),
        });
    }

    return (
        <SettingsUtilityCard
            title="AI Harness"
            rows
            footer={
                <>
                    {update.isSuccess && !dirty && (
                        <span className="mr-auto text-[11px] text-matcha">Saved</span>
                    )}
                    <Button
                        type="button"
                        variant="flat-primary"
                        size="sm"
                        loading={update.isPending}
                        disabled={!canSave}
                        onClick={save}
                    >
                        Save changes
                    </Button>
                </>
            }
        >
            <SettingsRow
                label="Execution mode"
                description="How much the agent decides on its own. An issue can override this."
                stack
            >
                <SettingsTilePicker
                    name="executionMode"
                    columns={2}
                    options={EXECUTION_MODE_OPTIONS}
                    value={mode}
                    onChange={setModeDraft}
                />
            </SettingsRow>

            <SettingsRow
                label="Harness"
                description="The agent CLI that runs issues in this project."
                stack
            >
                <SettingsTilePicker
                    name="harness"
                    columns={3}
                    options={HARNESS_OPTIONS}
                    value={harness}
                    onChange={pickHarness}
                />
            </SettingsRow>

            <SettingsRow label="Default model">
                <SelectField
                    aria-label="Default model"
                    className="w-64"
                    value={model ?? undefined}
                    onChange={setModelDraft}
                    placeholder="Select a model"
                    options={availableModels.map((m) => ({ value: m, label: m }))}
                />
            </SettingsRow>

            {supportsEffort && (
                <SettingsRow label="Default effort">
                    <SelectField
                        aria-label="Default effort"
                        className="w-64"
                        value={effort ?? undefined}
                        onChange={(v) => setEffortDraft(v as Effort)}
                        placeholder="Select an effort level"
                        options={EFFORT_OPTIONS.map((e) => ({ value: e.id, label: e.label }))}
                    />
                </SettingsRow>
            )}
        </SettingsUtilityCard>
    );
}
