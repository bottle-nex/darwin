"use client";

import { useGetProject } from "@/hooks/project/useGetProject";
import { useSpaceOverview } from "@/hooks/spaces/useSpaceOverview";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSpaceFormStore } from "@/store/space/useSpaceFormStore";
import type { BoardSpace } from "@/types/board";

import SpaceOverviewMain from "./SpaceOverviewMain";

export default function SpaceOverview({ space }: { space: BoardSpace }) {
    const progress = useSpaceOverview(space.id);
    const openEdit = useSpaceFormStore((s) => s.openEdit);
    const { data: project } = useGetProject(useActiveProject()?.id);
    const canManage = project?.viewerRole === "Admin" || project?.viewerRole === "Maintain";

    return (
        <div data-lenis-prevent className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-2xl px-8 py-10">
                <SpaceOverviewMain
                    space={space}
                    progress={progress}
                    onEdit={canManage ? () => openEdit(space.id) : undefined}
                />
            </div>
        </div>
    );
}
