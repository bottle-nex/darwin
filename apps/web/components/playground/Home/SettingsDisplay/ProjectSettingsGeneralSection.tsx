"use client";
import { DeleteIcon } from "@trydarwin/ui/icons";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { type IconPick, IconPickButton } from "@/components/ui/IconPicker";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteProject } from "@/hooks/project/useDeleteProject";
import { useGetProjectConfig } from "@/hooks/project/useGetProjectConfig";
import { useUpdateProject } from "@/hooks/project/useUpdateProject";
import { cn } from "@/lib/utils";
import type { KanbanOptionView, ProjectDetail } from "@/types/project";

import ProjectSettingsBoardSection from "./ProjectSettingsBoardSection";
import SettingsRow, { SETTINGS_CONTROL_WIDTH } from "./SettingsRow";
import SettingsUtilityCard from "./SettingsUtilityCard";

export default function ProjectSettingsGeneralSection({
    project,
    isAdmin,
    orgSlug,
}: {
    project: ProjectDetail;
    isAdmin: boolean;
    orgSlug: string;
}) {
    const router = useRouter();
    const update = useUpdateProject();
    const del = useDeleteProject();
    const [name, setName] = useState(project.name);
    const [slug, setSlug] = useState(project.slug);
    const [description, setDescription] = useState(project.description ?? "");
    const [icon, setIcon] = useState<IconPick | null>(project.icon);
    const [iconOpen, setIconOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [optionsBarDraft, setOptionsBarDraft] = useState<KanbanOptionView | null>(null);
    const [productDiffDraft, setProductDiffDraft] = useState<boolean | null>(null);

    const { data: config } = useGetProjectConfig(project.id);
    const savedOptionsBar = config?.kanbanOptionView ?? "FLAT";
    const optionsBarView = optionsBarDraft ?? savedOptionsBar;
    const optionsBarDirty = optionsBarDraft !== null && optionsBarDraft !== savedOptionsBar;
    const savedProductDiff = config?.productDiffEnabled ?? false;
    const productDiffEnabled = productDiffDraft ?? savedProductDiff;
    const productDiffDirty = productDiffDraft !== null && productDiffDraft !== savedProductDiff;

    const iconDirty = JSON.stringify(icon) !== JSON.stringify(project.icon);
    const dirty =
        name.trim() !== project.name ||
        slug.trim() !== project.slug ||
        description.trim() !== (project.description ?? "") ||
        iconDirty ||
        optionsBarDirty ||
        productDiffDirty;
    const canSave = name.trim().length > 0 && slug.trim().length > 0 && dirty && !update.isPending;

    const slugTaken =
        isAxiosError(update.error) && update.error.response?.data?.error?.code === "SLUG_TAKEN";

    function save() {
        if (!canSave) return;
        update.mutate({
            project_id: project.id,
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim(),
            ...(iconDirty && icon && { icon }),
            ...(optionsBarDirty && { kanban_option_view: optionsBarView }),
            ...(productDiffDirty && { product_diff_enabled: productDiffEnabled }),
        });
    }

    function remove() {
        del.mutate(project.id, {
            onSuccess: () => router.push(`/playground/${orgSlug}`),
        });
    }

    return (
        <div className="flex flex-col gap-12">
            <SettingsUtilityCard title="Project" rows>
                <SettingsRow label="Icon" description="Shown next to the project everywhere.">
                    <IconPickButton
                        pick={icon}
                        onSelect={setIcon}
                        open={iconOpen}
                        onOpenChange={setIconOpen}
                        label="Pick project icon"
                        align="end"
                    />
                </SettingsRow>

                <SettingsRow label="Name">
                    <Input
                        variant="outline"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={cn(SETTINGS_CONTROL_WIDTH, "h-8 px-2.5 text-[13px]")}
                    />
                </SettingsRow>

                <SettingsRow
                    label="Slug"
                    description={
                        slugTaken ? (
                            <span className="text-red-400">That slug is already taken.</span>
                        ) : (
                            "Used in this project's URLs."
                        )
                    }
                >
                    <Input
                        variant="outline"
                        value={slug}
                        onChange={(e) =>
                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                        }
                        className={cn(SETTINGS_CONTROL_WIDTH, "h-8 px-2.5 font-mono text-[13px]")}
                    />
                </SettingsRow>

                <SettingsRow label="Description" description="Up to 150 characters." stack>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={150}
                        placeholder="Add description for your project"
                        className="max-h-40 min-h-0 w-full resize-none overflow-y-auto px-0! py-0 text-[13px] bg-transparent!"
                    />
                </SettingsRow>
            </SettingsUtilityCard>

            <SettingsUtilityCard
                title="Board & previews"
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
                    label="Options bar"
                    description="Choose how kanban controls are laid out."
                    stack
                >
                    <ProjectSettingsBoardSection
                        value={optionsBarView}
                        onChange={setOptionsBarDraft}
                    />
                </SettingsRow>

                <SettingsRow
                    label="Product Diff"
                    description="Generate visual base and head previews for frontend pull requests."
                >
                    <Switch
                        checked={productDiffEnabled}
                        onCheckedChange={setProductDiffDraft}
                        aria-label="Enable Product Diff"
                    />
                </SettingsRow>
            </SettingsUtilityCard>

            {isAdmin && (
                <SettingsUtilityCard title="Danger zone" rows>
                    <SettingsRow
                        label="Delete this project"
                        description={`Removes ${project.name} and everything in it, teams, issues, and secrets, for good.`}
                    >
                        <Button
                            type="button"
                            variant="flat-destructive"
                            size="sm"
                            onClick={() => setConfirmOpen(true)}
                            className="h-7.5!"
                        >
                            <DeleteIcon className="size-3" aria-hidden />
                            Delete project
                        </Button>
                    </SettingsRow>
                </SettingsUtilityCard>
            )}

            <Dialog open={confirmOpen} onOpenChange={(o) => !del.isPending && setConfirmOpen(o)}>
                <DialogContent className="border-white/10 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[14px] text-neutral-100">
                            Delete project?
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-neutral-500">
                            This permanently deletes{" "}
                            <span className="text-neutral-300">{project.name}</span> and everything
                            in it, teams, issues, and secrets. This can&rsquo;t be reverted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            size="sm"
                            variant="flat"
                            disabled={del.isPending}
                            onClick={() => setConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="flat-destructive"
                            loading={del.isPending}
                            onClick={remove}
                        >
                            Delete project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
