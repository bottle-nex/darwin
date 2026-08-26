"use client";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";

import ResourcePickerDialog from "./ResourcePickerDialog";

export default function DeleteTeamPickerDialog() {
    const pending = useCommandActionStore((s) => s.pending);
    const clear = useCommandActionStore((s) => s.clear);
    const requestDelete = useDeleteTeamStore((s) => s.requestDelete);
    const { data: project } = useGetProject(useActiveProject()?.id);

    const teams = project?.teams ?? [];

    return (
        <ResourcePickerDialog
            open={pending === "delete-team"}
            onOpenChange={(next) => !next && clear()}
            title="Delete team"
            placeholder="Search teams..."
            emptyLabel="No teams found."
            destructive
            resources={teams.map((team) => ({
                id: team.id,
                label: team.name,
                leading: (
                    <PlaygroundAvatar
                        tone="purple"
                        size="sm"
                        letter={team.name.slice(0, 2).toUpperCase()}
                    />
                ),
            }))}
            onPick={(id) => {
                const team = teams.find((candidate) => candidate.id === id);
                clear();
                if (team) requestDelete(team);
            }}
        />
    );
}
