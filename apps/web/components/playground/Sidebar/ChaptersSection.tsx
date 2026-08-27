"use client";

import {
    AddIcon,
    DeleteIcon,
    EditIcon,
    KanbanBoardLayoutIcon,
    OverflowMenuIcon,
} from "@trymatcha/ui/icons";
import { useParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useChapters } from "@/hooks/issues/useBoardColumns";
import { useChapterActions } from "@/hooks/kanban/useChapterActions";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { useDeleteChapterStore } from "@/store/chapter/useDeleteChapterStore";
import { useNewChapterStore } from "@/store/chapter/useNewChapterStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

import { PlaygroundTab } from "../playgroundTabs";
import Row from "./SidebarRow";
import Section from "./SidebarSection";

export default function PlaygroundSidebarChaptersSection() {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const activeProjectId = useActiveProject()?.id;
    const { data: project } = useGetProject(activeProjectId);
    const chapters = useChapters(activeProjectId);
    const tab = usePlaygroundNavStore((s) => s.tab);
    const selectedChapter = usePlaygroundNavStore((s) => s.selectedChapter);
    const openChapter = usePlaygroundNavStore((s) => s.openChapter);
    const requestDelete = useDeleteChapterStore((s) => s.requestDelete);
    const openCreate = useNewChapterStore((s) => s.setOpen);
    const { renameChapter } = useChapterActions();
    const [renamingId, setRenamingId] = useState<string | null>(null);

    const canManage = project?.viewerRole === "Admin" || project?.viewerRole === "Maintain";

    return (
        <Section title="Chapters">
            {chapters.map((chapter) => {
                const isActive =
                    tab === PlaygroundTab.Chapter && selectedChapter?.id === chapter.id;

                if (renamingId === chapter.id) {
                    return (
                        <div key={chapter.id} className="px-2 py-0.5">
                            <Input
                                autoFocus
                                defaultValue={chapter.name}
                                className="h-7 text-[13.5px]"
                                onBlur={(event) => {
                                    renameChapter(chapter.id, event.target.value);
                                    setRenamingId(null);
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") event.currentTarget.blur();
                                    if (event.key === "Escape") setRenamingId(null);
                                }}
                            />
                        </div>
                    );
                }

                return (
                    <div key={chapter.id} className="group/chapter relative">
                        <Row
                            className={cn(
                                !isActive &&
                                    "group-hover/chapter:bg-white/3 group-hover/chapter:text-neutral-100",
                            )}
                            label={chapter.name}
                            leading={{ kind: "icon", icon: KanbanBoardLayoutIcon }}
                            active={isActive}
                            onClick={() => openChapter(chapter, projectSlug ?? "")}
                        />
                        {canManage && (
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="unstyled"
                                        type="button"
                                        aria-label={`${chapter.name} actions`}
                                        className={cn(
                                            "absolute top-1/2 right-1 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-neutral-400 ring-inset transition-opacity hover:bg-white/5 hover:text-neutral-200 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden group-hover/chapter:pointer-events-auto group-hover/chapter:opacity-100 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100",
                                            isActive
                                                ? "opacity-100"
                                                : "pointer-events-none opacity-0",
                                        )}
                                    >
                                        <OverflowMenuIcon className="size-4" aria-hidden />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onSelect={() => setRenamingId(chapter.id)}>
                                        <EditIcon className="size-3.5" aria-hidden />
                                        <span className="flex-1">Rename</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={() => requestDelete(chapter)}
                                    >
                                        <DeleteIcon className="size-3.5" aria-hidden />
                                        <span className="flex-1">Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                );
            })}
            {canManage && (
                <Row
                    label="Add chapter"
                    leading={{ kind: "icon", icon: AddIcon }}
                    onClick={() => openCreate(true)}
                />
            )}
        </Section>
    );
}
