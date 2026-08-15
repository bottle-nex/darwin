"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { MdDelete } from "react-icons/md";
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
import ProjectSettingsBoardSection from "./ProjectSettingsBoardSection";

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
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [optionsBarDraft, setOptionsBarDraft] = useState<KanbanOptionView | null>(null);

    const { data: config } = useGetProjectConfig(project.id);
    const savedOptionsBar = config?.kanbanOptionView ?? "FLAT";
    const optionsBarView = optionsBarDraft ?? savedOptionsBar;
    const optionsBarDirty = optionsBarDraft !== null && optionsBarDraft !== savedOptionsBar;

    const dirty =
        name.trim() !== project.name ||
        slug.trim() !== project.slug ||
        description.trim() !== (project.description ?? "") ||
        optionsBarDirty;
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
            ...(optionsBarDirty && { kanban_option_view: optionsBarView }),
        });
    }

    function remove() {
        del.mutate(project.id, {
            onSuccess: () => router.push(`/playground/${orgSlug}`),
        });
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-[13px] font-semibold text-neutral-100">Project</h2>
                <p className="mt-1 text-[12px] text-neutral-500">
                    Change the name, slug, or description.
                </p>
            </div>

            <div>
                <label className="text-[12px] text-neutral-300">Name</label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(FIELD, "mt-1.5 h-9 text-[13px]")}
                />
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
                <DialogContent className="border-white/10 bg-charcoal sm:max-w-md">
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
