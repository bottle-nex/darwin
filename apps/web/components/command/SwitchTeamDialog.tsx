"use client";
import { useParams } from "next/navigation";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import ResourcePickerDialog from "./ResourcePickerDialog";

export default function SwitchTeamDialog() {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const pending = useCommandActionStore((s) => s.pending);
    const clear = useCommandActionStore((s) => s.clear);
    const { data: project } = useGetProject(useActiveProject()?.id);
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const openTeam = usePlaygroundNavStore((s) => s.openTeam);

    const teams = project?.teams ?? [];

    return (
        <ResourcePickerDialog
            open={pending === "switch-team"}
            onOpenChange={(next) => !next && clear()}
            title="Switch team"
            placeholder="Search teams..."
            emptyLabel="No teams found."
            activeId={selectedTeam?.id ?? null}
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
                if (team) openTeam(team, projectSlug ?? "");
            }}
        />
    );
}
