"use client";

import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import Row from "../PlaygroundSidebarRow";
import Section from "../PlaygroundSidebarSection";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import { matchesQuery, rowLeading, type SidebarNavRow, type SidebarSectionProps } from "./shared";

export const rows: SidebarNavRow[] = [];

export default function PlaygroundSidebarTeamsSection({ query }: SidebarSectionProps) {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const { data: project } = useGetProject(activeProject?.id);
    const { setOpen, setTargetProjectId } = useNewTeamStore();

    const searching = query.trim().length > 0;
    const teams = (project?.teams ?? []).filter((t) => matchesQuery(t.name, query));
    if (searching && teams.length === 0) return null;

    function openCreateTeam() {
        if (!activeProject) return;
        setTargetProjectId(activeProject.id);
        setOpen(true);
    }

    return (
        <div className="mt-3">
            <Section title="Teams">
                {teams.map((t) => (
                    <Row
                        key={t.id}
                        label={t.name}
                        leading={rowLeading({
                            kind: "avatar",
                            letter: t.name.trim().charAt(0).toUpperCase(),
                            tone: "indigo",
                        })}
                    />
                ))}
                {!searching && (
                    <Row
                        label="Add team"
                        leading={{ kind: "icon", icon: Plus }}
                        onClick={openCreateTeam}
                    />
                )}
            </Section>
        </div>
    );
}
