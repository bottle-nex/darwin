"use client";
import { useParams } from "next/navigation";
import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";
import { useDeleteProjectStore } from "@/store/project/useDeleteProjectStore";
import ResourcePickerDialog from "./ResourcePickerDialog";

export default function DeleteProjectPickerDialog() {
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const pending = useCommandActionStore((s) => s.pending);
    const clear = useCommandActionStore((s) => s.clear);
    const requestDelete = useDeleteProjectStore((s) => s.requestDelete);
    const { data: dashboard } = useGetDashboard(orgSlug);

    const projects = dashboard?.projects ?? [];

    return (
        <ResourcePickerDialog
            open={pending === "delete-project"}
            onOpenChange={(next) => !next && clear()}
            title="Delete project"
            placeholder="Search projects..."
            emptyLabel="No projects found."
            destructive
            resources={projects.map((project) => ({
                id: project.id,
                label: project.name,
                leading: (
                    <PlaygroundAvatar
                        tone={toneFor(project.id)}
                        icon={project.icon}
                        size="sm"
                        letter={project.name.slice(0, 2).toUpperCase()}
                    />
                ),
            }))}
            onPick={(id) => {
                const project = projects.find((candidate) => candidate.id === id);
                clear();
                if (project) requestDelete(project);
            }}
        />
    );
}
