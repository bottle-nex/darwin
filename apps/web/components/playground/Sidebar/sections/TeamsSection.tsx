"use client";

import { Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Row from "../PlaygroundSidebarRow";
import Section from "../PlaygroundSidebarSection";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import { matchesQuery, rowLeading, type SidebarNavRow, type SidebarSectionProps } from "./shared";
import { usePlaygroundMainViewStore } from "@/store/playground/usePlaygroundMainViewStore";

export const rows: SidebarNavRow[] = [];

export default function PlaygroundSidebarTeamsSection({ query }: SidebarSectionProps) {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const { data: project } = useGetProject(activeProject?.id);
    const { setOpen, setTargetProjectId } = useNewTeamStore();
    const requestDelete = useDeleteTeamStore((s) => s.requestDelete);

    const searching = query.trim().length > 0;
    const isAdmin = project?.viewerRole === "Admin";
    const { view, setView } = usePlaygroundMainViewStore();
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
                {teams.map((t) => {
                    const isActive = view.type === "team" && view.team.id === t.id;
                    return (
                        <div key={t.id} className="group relative">
                            <Row
                                label={t.name}
                                leading={rowLeading({
                                    kind: "avatar",
                                    letter: t.name.trim().charAt(0).toUpperCase(),
                                    tone: "indigo",
                                })}
                                active={isActive}
                                onClick={() =>
                                    setView({
                                        type: "team",
                                        projectSlug: projectSlug ?? "",
                                        team: t,
                                    })
                                }
                            />
                            <button
                                type="button"
                                aria-label={`Delete ${t.name}`}
                                onClick={() => requestDelete(t)}
                                className={cn(
                                    "absolute top-1/2 right-2 size-6 -translate-y-1/2 items-center justify-center rounded text-neutral-400 hover:bg-neutral-700/50 hover:text-red-500 cursor-pointer",
                                    isActive ? "flex" : "hidden group-hover:flex",
                                )}
                            >
                                <Trash2 className="size-3.5" aria-hidden />
                            </button>
                        </div>
                    );
                })}
                {!searching && isAdmin && (
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
