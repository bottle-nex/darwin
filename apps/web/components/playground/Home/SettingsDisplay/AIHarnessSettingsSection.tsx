"use client";
import { useState } from "react";
import NoResource from "@/components/utility/NoResource";
import ProjectsGlyph from "@/components/utility/ProjectsGlyph";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useGetProjectConfig } from "@/hooks/project/useGetProjectConfig";
import { useUpdateProjectConfig } from "@/hooks/project/useUpdateProjectConfig";
import {
    EFFORT_OPTIONS,
    HARNESS_MODELS,
    HARNESS_OPTIONS,
    HARNESS_SUPPORTS_EFFORT,
    type Effort,
    type Harness,
} from "@/types/harness.type";
import SettingsPaneShell from "./SettingsPaneShell";
import SectionHeader from "@/components/landing/SectionHeader";

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

    if (!isAdmin) {
        return (
            <SettingsPaneShell sectionKey="harness access denied">
                <NoResource
                    className="mt-12"
                    icon={<ProjectsGlyph className="size-24" />}
                    title="You don't have the access to the AI harness setup"
                    description="You've to be an admin of this Project to setup or update the default AI Harness, model, and effort"
                />
            </SettingsPaneShell>
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

    const dirty =
        harness !== savedHarness ||
        model !== savedModel ||
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
            ...(supportsEffort && effort ? { default_effort: effort } : {}),
        });
    }

    return (
        <SettingsPaneShell sectionKey="harness">
            <div className="flex flex-col gap-4">
                <SectionHeader
                    title="AI Harness"
                    description="Choose the default agent harness, model, and effort new issues in this project run with."
                />

                <div>
                    <label className="text-[12px] text-neutral-300">Harness</label>
                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                        {HARNESS_OPTIONS.map((option) => (
                            <label
                                key={option.id}
                                className="group cursor-pointer rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10 has-checked:border-primary/40 has-checked:bg-primary/10"
                            >
                                <input
                                    type="radio"
                                    name="harness"
                                    className="sr-only"
                                    value={option.id}
                                    checked={harness === option.id}
                                    onChange={() => pickHarness(option.id)}
                                />
                                <div className="flex items-center gap-1.5">
                                    <span className="size-3 rounded-full border border-white/20 transition-colors group-has-checked:border-primary group-has-checked:bg-primary/40" />
                                    <span className="text-[12px] font-medium text-neutral-300 transition-colors group-has-checked:text-neutral-100">
                                        {option.label}
                                    </span>
                                </div>
                                <p className="mt-1 px-0.5 text-[11px] text-neutral-500">
                                    {option.description}
                                </p>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[12px] text-neutral-300">Default model</label>
                    <Select value={model ?? undefined} onValueChange={(v) => setModelDraft(v)}>
                        <SelectTrigger className="mt-1.5 h-9 w-full text-[13px]">
                            <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableModels.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {supportsEffort && (
                    <div>
                        <label className="text-[12px] text-neutral-300">Default effort</label>
                        <Select
                            value={effort ?? undefined}
                            onValueChange={(v) => setEffortDraft(v as Effort)}
                        >
                            <SelectTrigger className="mt-1.5 h-9 w-full text-[13px]">
                                <SelectValue placeholder="Select an effort level" />
                            </SelectTrigger>
                            <SelectContent>
                                {EFFORT_OPTIONS.map((e) => (
                                    <SelectItem key={e.id} value={e.id}>
                                        {e.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="h-px bg-white/5" />

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        size="sm"
                        loading={update.isPending}
                        disabled={!canSave}
                        onClick={save}
                    >
                        Save changes
                    </Button>
                    {update.isSuccess && !dirty && (
                        <span className="text-[11px] text-matcha">Saved</span>
                    )}
                </div>
            </div>
        </SettingsPaneShell>
    );
}
