"use client";

import { useSpaces } from "@/hooks/issues/useBoardColumns";
import { useSpaceActions as useSpaceMutations } from "@/hooks/kanban/useSpaceActions";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useActiveProject } from "@/hooks/useActiveProject";
import { toast } from "@/lib/toast";
import { useDeleteSpaceStore } from "@/store/space/useDeleteSpaceStore";
import { useSpaceFormStore } from "@/store/space/useSpaceFormStore";

export type SpaceCommandActions = ReturnType<typeof useSpaceCommandActions>;

/**
 * Every mutation the command menu offers on a space, in one place, so one space
 * and many selected spaces go through the same handlers.
 *
 * Spaces have no bulk endpoint, so many ids fan out over the single-space PATCH.
 * That is `allSettled` rather than `all` on purpose: the server checks start-vs-target
 * per space against what is stored, so one date can legitimately fail on some of a
 * mixed selection while succeeding on the rest.
 */
export function useSpaceCommandActions(spaceIds: string[]) {
    const projectId = useActiveProject()?.id;
    const { data: project } = useGetProject(projectId);
    const allSpaces = useSpaces(projectId);
    const { editSpace } = useSpaceMutations();
    const openEditForm = useSpaceFormStore((s) => s.openEdit);
    const requestDeleteSpaces = useDeleteSpaceStore((s) => s.requestDelete);

    const spaces = allSpaces.filter((space) => spaceIds.includes(space.id));
    const space = spaces.length === 1 ? spaces[0] : undefined;
    const editable =
        spaces.length > 0 &&
        (project?.viewerRole === "Admin" || project?.viewerRole === "Maintain");

    async function patchDate(field: "startDate" | "targetDate", value: string | null) {
        if (!editable) return;
        const results = await Promise.allSettled(
            spaces.map((row) => editSpace(row.id, { [field]: value })),
        );
        const failed = results.filter(
            (result) => result.status === "rejected" || result.value === null,
        ).length;
        if (!failed) return;
        toast.error(
            failed === spaces.length
                ? "Couldn't update the dates."
                : `Couldn't update ${failed} of ${spaces.length} spaces.`,
        );
    }

    return {
        spaces,
        space,
        count: spaces.length,
        editable,
        setStartDate: (iso: string | null) => patchDate("startDate", iso),
        setTargetDate: (iso: string | null) => patchDate("targetDate", iso),
        openEdit: () => space && openEditForm(space.id),
        requestDelete: () => spaces.length && requestDeleteSpaces(...spaces.map((row) => row.id)),
    };
}
