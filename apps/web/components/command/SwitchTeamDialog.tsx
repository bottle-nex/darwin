"use client";
import { useParams } from "next/navigation";

import TeamAvatar from "@/components/playground/Core/components/TeamAvatar";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

import ResourcePickerDialog from "./ResourcePickerDialog";

export default function SwitchTeamDialog() {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const pending = useCommandActionStore((s) => s.pending);
    const clear = useCommandActionStore((s) => s.clear);
    const { data: project } = useGetProject(useActiveProject()?.id);
    const openTeam = usePlaygroundNavStore((s) => s.openTeam);

    const teams = project?.teams ?? [];

    return (
        <ResourcePickerDialog
            open={pending === "switch-team"}
            onOpenChange={(next) => !next && clear()}
            title="Switch team"
            placeholder="Search teams..."
            emptyLabel="No teams found."
            resources={teams.map((team) => ({
                id: team.id,
                label: team.name,
                leading: <TeamAvatar team={team} size="sm" />,
            }))}
            onPick={(id) => {
                const team = teams.find((candidate) => candidate.id === id);
                clear();
                if (team) openTeam(team, projectSlug ?? "");
            }}
        />
    );
}
