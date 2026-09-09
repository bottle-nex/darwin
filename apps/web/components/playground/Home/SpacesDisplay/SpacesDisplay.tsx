"use client";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import LogoLoader from "@/components/app/LogoLoader";
import NoResource from "@/components/utility/NoResource";
import ProjectsGlyph from "@/components/utility/ProjectsGlyph";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useGetProject } from "@/hooks/project/useGetProject";
import { SpaceSelectionOrderProvider, useSpaceSelection } from "@/hooks/spaces/useSpaceSelection";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useDeleteSpaceStore } from "@/store/space/useDeleteSpaceStore";
import { useSpaceFormStore } from "@/store/space/useSpaceFormStore";

import { SPACE_CELL } from "./spaceCells";
import SpaceRow from "./SpaceRow";
import SpacesOptionsBar from "./SpacesOptionsBar";

export default function SpacesDisplay() {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const activeProjectId = useActiveProject()?.id;
    const { data: project } = useGetProject(activeProjectId);
    const { data: metadata, isLoading, isError } = useBoardColumns(activeProjectId);
    const openSpace = usePlaygroundNavStore((s) => s.openSpace);
    const openCreate = useSpaceFormStore((s) => s.openCreate);
    const openEdit = useSpaceFormStore((s) => s.openEdit);
    const requestDelete = useDeleteSpaceStore((s) => s.requestDelete);
    const { selectedIds, isSelected, toggleSelection } = useSpaceSelection();

    const canManage = project?.viewerRole === "Admin" || project?.viewerRole === "Maintain";

    const rows = useMemo(() => {
        if (!metadata) return [];
        return metadata.spaces.map((space) => {
            const columns = metadata.columns.filter((column) => column.spaceId === space.id);
            const issueCount = columns.reduce(
                (total, column) => total + (metadata.totals.custom[column.id] ?? 0),
                0,
            );
            const doneCount = columns.reduce(
                (total, column) => total + (metadata.totals.done[column.id] ?? 0),
                0,
            );
            return { space, issueCount, doneCount };
        });
    }, [metadata]);

    const orderedSpaceIds = useMemo(() => rows.map((row) => row.space.id), [rows]);
    const selectedAt = (index: number) => {
        const row = rows[index];
        return Boolean(row) && isSelected(row.space.id);
    };

    return (
        <SpaceSelectionOrderProvider spaceIds={orderedSpaceIds}>
            <div className="relative flex min-h-0 flex-1 flex-col">
                <SpacesOptionsBar count={rows.length} canManage={canManage} onCreate={openCreate} />

                <section
                    data-lenis-prevent
                    className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-2"
                >
                    {isLoading ? (
                        <LogoLoader size={32} className="py-16" />
                    ) : isError ? (
                        <p className="px-2.5 py-3 text-[12px] text-danger">
                            Couldn&apos;t load spaces.
                        </p>
                    ) : !rows.length ? (
                        <NoResource
                            className="mt-12 pl-[4%]"
                            icon={<ProjectsGlyph className="size-24" />}
                            title="No spaces yet"
                            description="A space is a board you build yourself, with your own columns, sitting alongside the agent's board. Use one per workstream — design, research, a release — and park the issues that belong to it there."
                            action={
                                canManage
                                    ? { label: "Create space", onClick: openCreate }
                                    : undefined
                            }
                        />
                    ) : (
                        <>
                            <div className="mt-2 flex shrink-0 items-center gap-3 px-3 pb-2 text-[11px] font-medium tracking-wide text-neutral-500">
                                <span className="size-3.5 shrink-0" />
                                <span className="min-w-0 flex-1">Name</span>
                                <span className={SPACE_CELL.description}>Description</span>
                                <span className={SPACE_CELL.target}>Target</span>
                                <span className={SPACE_CELL.issues}>Issues</span>
                                <span className={cn(SPACE_CELL.progress, "text-right")}>
                                    Progress
                                </span>
                                <span className={SPACE_CELL.actions} />
                            </div>

                            <div className="flex flex-col pt-1.5">
                                {rows.map(({ space, issueCount, doneCount }, index) => (
                                    <SpaceRow
                                        key={space.id}
                                        space={space}
                                        issueCount={issueCount}
                                        doneCount={doneCount}
                                        canManage={canManage}
                                        selected={isSelected(space.id)}
                                        selectionActive={selectedIds.length > 0}
                                        joinedAbove={selectedAt(index - 1)}
                                        joinedBelow={selectedAt(index + 1)}
                                        onToggleSelection={() => toggleSelection(space.id)}
                                        onOpen={() => openSpace(space, projectSlug ?? "")}
                                        onEdit={() => openEdit(space.id)}
                                        onDelete={() => requestDelete(space.id)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </SpaceSelectionOrderProvider>
    );
}
