"use client";
import { useMemo, useState } from "react";
import { MdDelete, MdEdit, MdLabel } from "react-icons/md";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useListTags } from "@/hooks/tags/useListTags";
import { useDeleteTag } from "@/hooks/tags/useDeleteTag";
import { Button } from "@/components/ui/button";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Tag } from "@/types/tags";
import TagDisplay from "./TagDisplay";
import TagFormDialog from "./TagFormDialog";
import TagsOptionsBar from "./TagsOptionsBar";
import { useTagsOptions } from "./useTagsOptions";

export default function TagsMainPane() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = dashboard?.projects.find((p) => p.slug === projectSlug);

    const { data: tags, isLoading, isError } = useListTags(activeProject?.id);
    const deleteTag = useDeleteTag();
    const options = useTagsOptions();

    const [formOpen, setFormOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);

    // Search narrows the list by name; sort reorders it.
    const visibleTags = useMemo(() => {
        const query = options.search.trim().toLowerCase();
        const list = (tags ?? []).filter((tag) =>
            query ? tag.name.toLowerCase().includes(query) : true,
        );
        return list.sort((a, b) =>
            options.sort === "name"
                ? a.name.localeCompare(b.name)
                : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }, [tags, options.search, options.sort]);

    function openCreate() {
        setEditingTag(undefined);
        setFormOpen(true);
    }

    function openEdit(tag: Tag) {
        setEditingTag(tag);
        setFormOpen(true);
    }

    function handleDelete() {
        if (!activeProject?.id || !deleteTarget) return;
        deleteTag.mutate(
            { projectId: activeProject.id, tagId: deleteTarget.id },
            {
                onSuccess: () => {
                    toast.success("Tag deleted.");
                    setDeleteTarget(null);
                },
                onError: () => toast.error("Couldn't delete the tag."),
            },
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <TagsOptionsBar options={options} count={tags?.length ?? 0} onCreate={openCreate} />

            <div
                data-lenis-prevent
                className="no-scrollbar mx-auto mt-5 flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-2.25 overflow-y-auto px-5 pb-5"
            >
                {isLoading ? (
                    [0, 1, 2].map((i) => (
                        <div key={i} className="h-10.5 animate-pulse rounded-lg bg-white/5" />
                    ))
                ) : isError ? (
                    <p className="px-1 py-2 text-[12px] text-red-400">Couldn&apos;t load tags.</p>
                ) : !tags?.length ? (
                    <div className="flex h-full flex-col justify-center">
                        <PaneEmptyState
                            icon={MdLabel}
                            title="No tags yet"
                            subtitle="Make a tag to start labeling your issues, like labels on GitHub."
                        />
                    </div>
                ) : !visibleTags.length ? (
                    <div className="flex h-full flex-col justify-center">
                        <PaneEmptyState
                            icon={MdLabel}
                            title="No tags match your search"
                            subtitle="Try a different name."
                        />
                    </div>
                ) : (
                    visibleTags.map((tag) => (
                        <div
                            key={tag.id}
                            className="group flex items-center justify-between gap-3 rounded-lg bg-white/3 px-3 py-2.5 shadow-[inset_0_1px_0_0_#262626]"
                        >
                            <TagDisplay name={tag.name} color={tag.color} />

                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Edit ${tag.name}`}
                                    onClick={() => openEdit(tag)}
                                >
                                    <MdEdit className="size-3.5 text-neutral-400" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Delete ${tag.name}`}
                                    onClick={() => setDeleteTarget(tag)}
                                >
                                    <MdDelete className="size-3.5 text-red-400" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {activeProject?.id && (
                <TagFormDialog
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    projectId={activeProject.id}
                    tag={editingTag}
                />
            )}

            <Dialog
                open={Boolean(deleteTarget)}
                onOpenChange={(next) => {
                    if (!next) setDeleteTarget(null);
                }}
            >
                <DialogContent className="border-white/10 bg-charcoal sm:max-w-100">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-100">Delete tag</DialogTitle>
                        <DialogDescription className="text-neutral-500">
                            This removes the tag from your project. Issues using it will lose this
                            label. This can&apos;t be undone.
                        </DialogDescription>
                    </DialogHeader>

                    {deleteTarget && (
                        <div className="py-1">
                            <TagDisplay name={deleteTarget.name} color={deleteTarget.color} />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="tertiary"
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleteTag.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            loading={deleteTag.isPending}
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
