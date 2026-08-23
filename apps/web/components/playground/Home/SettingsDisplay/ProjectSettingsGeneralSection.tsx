"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { MdDelete } from "react-icons/md";
import { PiSmileyFill } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useUpdateProject } from "@/hooks/project/useUpdateProject";
import { useDeleteProject } from "@/hooks/project/useDeleteProject";
import { useGetProjectConfig } from "@/hooks/project/useGetProjectConfig";
import type { KanbanOptionView, ProjectDetail } from "@/types/project";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import IconPicker, { IconPickGlyph, type IconPick } from "@/components/ui/IconPicker";
import ProjectSettingsBoardSection from "./ProjectSettingsBoardSection";
import SettingsSectionHeader from "./SettingsSectionHeader";

const FIELD =
    "border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-matcha focus-visible:ring-matcha/30";

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
        <div className="flex flex-col gap-4">
            <SettingsSectionHeader
                title="Project"
                description="Change the name, slug, or description."
            />

            <div className="flex gap-3">
                <div>
                    <label className="text-[12px] text-neutral-300">Icon</label>
                    <IconPicker open={iconOpen} onOpenChange={setIconOpen} onSelect={setIcon}>
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label="Pick project icon"
                            style={
                                icon?.kind === "icon"
                                    ? { backgroundColor: `${icon.color}33` }
                                    : undefined
                            }
                            className={cn(
                                "mt-1.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors",
                                icon?.kind === "icon"
                                    ? "hover:brightness-125"
                                    : "bg-white/5 hover:bg-white/10",
                            )}
                        >
                            {icon ? (
                                <IconPickGlyph pick={icon} className="size-4 text-base" />
                            ) : (
                                <PiSmileyFill className="size-4 text-white/60" aria-hidden />
                            )}
                        </Button>
                    </IconPicker>
                </div>
                <div className="flex-1">
                    <label className="text-[12px] text-neutral-300">Name</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={cn(FIELD, "mt-1.5 h-9 text-[13px]")}
                    />
                </div>
            </div>

            <div>
                <label className="text-[12px] text-neutral-300">Slug</label>
                <Input
                    value={slug}
                    onChange={(e) =>
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    className={cn(FIELD, "mt-1.5 h-9 font-mono text-[13px]")}
                />
                {slugTaken && (
                    <p className="mt-1.5 text-[11px] text-red-400">That slug is already taken.</p>
                )}
            </div>

            <div>
                <label className="text-[12px] text-neutral-300">Description</label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={150}
                    rows={8}
                />
            </div>

            <ProjectSettingsBoardSection value={optionsBarView} onChange={setOptionsBarDraft} />

            <div className="flex items-center justify-between gap-4 rounded-lg border border-white/8 p-3">
                <div>
                    <p className="text-[12px] font-medium text-neutral-200">Product Diff</p>
                    <p className="mt-1 text-[11px] text-neutral-500">
                        Generate visual base and head previews for frontend pull requests.
                    </p>
                </div>
                <Switch
                    checked={productDiffEnabled}
                    onCheckedChange={setProductDiffDraft}
                    aria-label="Enable Product Diff"
                />
            </div>

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
                {isAdmin && (
                    <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="ml-auto"
                        onClick={() => setConfirmOpen(true)}
                    >
                        <MdDelete className="size-3" aria-hidden />
                        Delete project
                    </Button>
                )}
            </div>

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
                            variant="tertiary"
                            disabled={del.isPending}
                            onClick={() => setConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
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
