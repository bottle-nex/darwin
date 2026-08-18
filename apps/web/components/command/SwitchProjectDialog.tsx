"use client";
import { useParams, useRouter } from "next/navigation";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";
import ResourcePickerDialog from "./ResourcePickerDialog";

export default function SwitchProjectDialog() {
    const router = useRouter();
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const pending = useCommandActionStore((s) => s.pending);
    const clear = useCommandActionStore((s) => s.clear);
    const { data: dashboard } = useGetDashboard(orgSlug);

    const projects = dashboard?.projects ?? [];

    return (
        <ResourcePickerDialog
            open={pending === "switch-project"}
            onOpenChange={(next) => !next && clear()}
            title="Switch project"
            placeholder="Search projects..."
            emptyLabel="No projects found."
            resources={projects.map((project) => ({
                id: project.id,
                label: project.name,
                leading: (
                    <PlaygroundAvatar
                        tone="indigo"
                        size="sm"
                        letter={project.name.slice(0, 2).toUpperCase()}
                    />
                ),
            }))}
            onPick={(id) => {
                const project = projects.find((candidate) => candidate.id === id);
                clear();
                if (project && project.slug !== projectSlug) {
                    router.push(`/playground/${orgSlug}/${project.slug}`);
                }
            }}
        />
    );
}
