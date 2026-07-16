"use client";

import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Row from "./SidebarRow";
import Section from "./SidebarSection";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import { rowLeading } from "./shared";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

export default function PlaygroundSidebarTeamsSection() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const { data: project } = useGetProject(activeProject?.id);
    const { setOpen, setTargetProjectId } = useNewTeamStore();
    const requestDelete = useDeleteTeamStore((s) => s.requestDelete);

    const isAdmin = project?.viewerRole === "Admin";
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const openTeam = usePlaygroundNavStore((s) => s.openTeam);
    const teams = project?.teams ?? [];

    function openCreateTeam() {
        if (!activeProject) return;
        setTargetProjectId(activeProject.id);
        setOpen(true);
    }

    return (
        <Section title="Teams">
            {teams.map((t) => {
                const isActive = selectedTeam?.id === t.id;
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
                            onClick={() => openTeam(t, projectSlug ?? "")}
                        />
                        <button
                            type="button"
                            aria-label={`Delete ${t.name}`}
                            onClick={() => requestDelete(t)}
                            className={cn(
                                "absolute top-1/2 right-2 size-6 -translate-y-1/2 items-center justify-center rounded text-neutral-400 hover:bg-neutral-700/50 hover:text-red-500 cursor-pointer ring-inset focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden",
                                isActive ? "flex" : "hidden group-hover:flex",
                            )}
                        >
                            <HiOutlineTrash className="size-3.5" aria-hidden />
                        </button>
                    </div>
                );
            })}
            {isAdmin && (
                <Row
                    label="Add team"
                    leading={{ kind: "icon", icon: HiOutlinePlus }}
                    onClick={openCreateTeam}
                />
            )}
        </Section>
    );
}
