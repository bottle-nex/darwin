"use client";
import { useEffect, useMemo, useState } from "react";
import { MdCheck, MdLabel } from "react-icons/md";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useListTags } from "@/hooks/tags/useListTags";
import { Button } from "@/components/ui/button";
import LogoLoader from "@/components/app/LogoLoader";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import NoResource from "@/components/utility/NoResource";
import ProjectsGlyph from "@/components/utility/ProjectsGlyph";
import type { Tag } from "@/types/tags";
import { useTagsOptionsStore } from "@/store/tags/useTagsOptionsStore";
import { useDeleteTagStore } from "@/store/tags/useDeleteTagStore";
import PlaygroundAvatar, {
    initialOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import TagDisplay from "./TagDisplay";
import CreateTagDialog from "./CreateTagDialog";
import TagsOptionsBar from "./TagsOptionsBar";

export default function TagsDisplay() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = dashboard?.projects.find((p) => p.slug === projectSlug);

    const { data: tags, isLoading, isError } = useListTags(activeProject?.id);
    const requestDelete = useDeleteTagStore((s) => s.requestDelete);
    const search = useTagsOptionsStore((s) => s.search);
    const sort = useTagsOptionsStore((s) => s.sort);

    const [formOpen, setFormOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | undefined>(undefined);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const selectedTags = (tags ?? []).filter((tag) => selectedIds.includes(tag.id));

    const visibleTags = useMemo(() => {
        const query = search.trim().toLowerCase();
        const list = (tags ?? []).filter((tag) =>
            query ? tag.name.toLowerCase().includes(query) : true,
        );
        return list.sort((a, b) =>
            sort === "name"
                ? a.name.localeCompare(b.name)
                : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }, [tags, search, sort]);

    function openCreate() {
        setEditingTag(undefined);
        setFormOpen(true);
    }

    useEffect(() => {
        if (!selectedIds.length) return;

        function clearOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setSelectedIds([]);
        }

        window.addEventListener("keydown", clearOnEscape);
        return () => window.removeEventListener("keydown", clearOnEscape);
    }, [selectedIds.length]);

    function toggleSelect(tagId: string) {
        setSelectedIds((current) =>
            current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
        );
    }

    function editSelected() {
        const [tag] = selectedTags;
        if (!tag) return;
        setEditingTag(tag);
        setFormOpen(true);
        setSelectedIds([]);
    }

    function deleteSelected() {
        if (!selectedTags.length) return;
        requestDelete(...selectedTags);
        setSelectedIds([]);
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <TagsOptionsBar
                count={tags?.length ?? 0}
                onCreate={openCreate}
                selectedCount={selectedTags.length}
                onEditSelected={editSelected}
                onDeleteSelected={deleteSelected}
                onClearSelection={() => setSelectedIds([])}
            />

            <section
                data-lenis-prevent
                className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-2"
            >
                {!!visibleTags.length && (
                    <div className="grid shrink-0 grid-cols-[1fr_180px_140px] items-center gap-4 px-2.5 pb-2 pl-9 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                        <span>Name</span>
                        <span>Created by</span>
                        <span>Created</span>
                    </div>
                )}

                <div className="flex flex-col gap-0.5 pt-1.5">
                    {isLoading ? (
                        <LogoLoader size={32} className="py-16" />
                    ) : isError ? (
                        <p className="px-2.5 py-3 text-[12px] text-red-400">
                            Couldn&apos;t load tags.
                        </p>
                    ) : !tags?.length ? (
                        <NoResource
                            className="pl-[4%] mt-12"
                            icon={<ProjectsGlyph className="size-24" />}
                            title="No tags yet"
                            description="Tags are labels you attach to issues to group and filter them, like labels on GitHub. Use them to mark bugs, features, or priorities so you and your agents can sort the board at a glance. Create your first tag to start organizing."
                            action={{ label: "Create tag", onClick: openCreate }}
                        />
                    ) : !visibleTags.length ? (
                        <PaneEmptyState
                            icon={MdLabel}
                            title="No tags match your search"
                            subtitle="Try a different name."
                        />
                    ) : (
                        visibleTags.map((tag) => (
                            <TagRow
                                key={tag.id}
                                tag={tag}
                                selected={selectedIds.includes(tag.id)}
                                selectionActive={selectedTags.length > 0}
                                onToggleSelect={() => toggleSelect(tag.id)}
                            />
                        ))
                    )}
                </div>
            </section>

            {activeProject?.id && (
                <CreateTagDialog
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    projectId={activeProject.id}
                    tag={editingTag}
                />
            )}
        </div>
    );
}

type TagRowProps = {
    tag: Tag;
    selected: boolean;
    selectionActive: boolean;
    onToggleSelect: () => void;
};

function TagRow({ tag, selected, selectionActive, onToggleSelect }: TagRowProps) {
    return (
        <div
            onClick={selectionActive ? onToggleSelect : undefined}
            className={cn(
                "group grid grid-cols-[1fr_180px_140px] items-center gap-4 rounded-md px-2.5 py-3 hover:bg-snow/5",
                selectionActive && "cursor-pointer select-none",
                selected && "bg-snow/5",
            )}
        >
            <div className="flex min-w-0 items-center gap-3">
                <Button
                    type="button"
                    variant="unstyled"
                    role="checkbox"
                    aria-checked={selected}
                    aria-label={`Select ${tag.name}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect();
                    }}
                    className={cn(
                        "flex size-3.5 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
                        selected
                            ? "border-neutral-200 bg-neutral-200 text-neutral-900"
                            : "invisible border-white/25 group-hover:visible",
                    )}
                >
                    {selected && <MdCheck className="size-2.5" aria-hidden />}
                </Button>
                <TagDisplay name={tag.name} color={tag.color} />
            </div>

            {tag.creator ? (
                <div className="flex min-w-0 items-center gap-2">
                    <PlaygroundAvatar
                        size="sm"
                        className="rounded-full"
                        src={tag.creator.image}
                        letter={initialOf(tag.creator.name, tag.creator.id)}
                        tone={toneFor(tag.creator.id)}
                    />
                    <span className="truncate text-[12px] text-neutral-300">
                        {tag.creator.name ?? "Unknown"}
                    </span>
                </div>
            ) : (
                <span className="text-[12px] text-neutral-500">—</span>
            )}

            <span className="text-[12px] text-neutral-400">{formatDate(tag.createdAt)}</span>
        </div>
    );
}
