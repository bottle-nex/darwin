"use client";
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
import { EXECUTION_MODE_OPTIONS } from "@/types/project";

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

    const harness = config?.harness ?? "Claude";
    const availableModels = HARNESS_MODELS[harness];
    const supportsEffort = HARNESS_SUPPORTS_EFFORT[harness];
    const model = config?.defaultModel ?? null;
    const effort = config?.defaultEffort ?? null;
    const mode = config?.executionMode ?? "Autonomous";

    function pickHarness(next: Harness) {
        const nextModel = HARNESS_MODELS[next][0] ?? null;
        update.mutate({
            projectId,
            harness: next,
            ...(nextModel ? { default_model: nextModel } : {}),
        });
    }

    return (
        <SettingsUtilityCard title="AI Harness" rows>
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
                    onChange={(next) => update.mutate({ projectId, execution_mode: next })}
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
                    onChange={(next) => update.mutate({ projectId, default_model: next })}
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
                        onChange={(next) =>
                            update.mutate({ projectId, default_effort: next as Effort })
                        }
                        placeholder="Select an effort level"
                        options={EFFORT_OPTIONS.map((e) => ({ value: e.id, label: e.label }))}
                    />
                </SettingsRow>
            )}
        </SettingsUtilityCard>
    );
}
