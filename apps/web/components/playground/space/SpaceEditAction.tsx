"use client";
import { EditIcon } from "@trymatcha/ui/icons";

import OptionButton from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/OptionButton";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useActiveProject } from "@/hooks/useActiveProject";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useSpaceFormStore } from "@/store/space/useSpaceFormStore";

/** The pencil beside an open space's breadcrumb. Renders nothing anywhere else. */
export default function SpaceEditAction() {
    const tab = usePlaygroundNavStore((s) => s.tab);
    const selectedSpace = usePlaygroundNavStore((s) => s.selectedSpace);
    const openEdit = useSpaceFormStore((s) => s.openEdit);
    const activeProjectId = useActiveProject()?.id;
    const { data: project } = useGetProject(activeProjectId);

    const canManage = project?.viewerRole === "Admin" || project?.viewerRole === "Maintain";
    if (tab !== PlaygroundTab.Space || !selectedSpace || !canManage) return null;

    return (
        <OptionButton
            label={`Edit ${selectedSpace.name}`}
            icon={EditIcon}
            className="ml-1 size-6"
            onClick={() => openEdit(selectedSpace.id)}
        />
    );
}
