"use client";
import { useState } from "react";
import { BriefcaseBusiness, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import Row from "../../sidebar/SidebarRow";
import { rowLeading } from "../../sidebar/shared";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useNewTeamStore } from "@/store/team/useNewTeamStore";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../iconrail/railSurface";
import { PROJECT_TAB_LABELS, ProjectsTab } from "../projectsTabs";

/**
 * The "Teams" settings nav item, rendered as an expandable tree. The row is a
 * disclosure control — its chevron rotates between collapsed (▶) and expanded
 * (▼), and a vertical guide line connects the project's teams beneath it. Each
 * child row opens that team's detail pane; selecting the row itself opens the
 * Teams settings panel. Add / delete affordances mirror the right-pane panel:
 * add is Admin-only, delete is available to anyone who can manage the project.
 */
export default function ProjectTeamsNavItem({
    selectedRowId,
    onSelect,
}: {
    selectedRowId: string;
    onSelect: (id: string) => void;
}) {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const { data: project } = useGetProject(activeProject?.id);

    const { setOpen, setTargetProjectId } = useNewTeamStore();
    const requestDelete = useDeleteTeamStore((s) => s.requestDelete);
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const openTeam = usePlaygroundNavStore((s) => s.openTeam);

    const isTeamsTab = selectedRowId === ProjectsTab.SettingsTeams;
    const isTeamDetail = selectedRowId === ProjectsTab.TeamDetail;

    // Open by default whenever we land already inside the Teams context (e.g. a
    // deep link / reload on the Teams panel or a team detail); the chevron then
    // toggles it freely from there.
    const [treeOpen, setTreeOpen] = useState(isTeamsTab || isTeamDetail);

    const isAdmin = project?.viewerRole === "Admin";
    const canManage = isAdmin || project?.viewerRole === "Maintain";
    const teams = project?.teams ?? [];

    function openCreateTeam() {
        if (!activeProject) return;
        setTargetProjectId(activeProject.id);
        setOpen(true);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    onSelect(ProjectsTab.SettingsTeams);
                    // Coming from elsewhere always reveals the tree; clicking the
                    // row while already on Teams toggles it like a disclosure.
                    setTreeOpen((v) => (isTeamsTab ? !v : true));
                }}
                style={{ paddingLeft: 8 }}
                className={cn(
                    "group flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 text-left text-[13px]",
                    isTeamsTab
                        ? "bg-white/10 text-neutral-100"
                        : "text-neutral-300 hover:bg-white/5 hover:text-neutral-100",
                )}
            >
                <span className="flex size-5 shrink-0 items-center justify-center text-neutral-400">
                    <BriefcaseBusiness className="size-3.75" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px]">
                    {PROJECT_TAB_LABELS[ProjectsTab.SettingsTeams]}
                </span>
                <ChevronRight
                    className={cn(
                        "size-3.5 shrink-0 text-neutral-500 transition-transform duration-150",
                        treeOpen && "rotate-90",
                    )}
                    aria-hidden
                />
            </button>

            {treeOpen && (
                <div className="relative">
                    {/* Vertical guide line, aligned under the parent's icon. */}
                    <span
                        aria-hidden
                        className="pointer-events-none absolute top-0 bottom-3 left-4.5 z-10 w-px bg-white/10"
                    />
                    {teams.map((t) => {
                        const isActive = isTeamDetail && selectedTeam?.id === t.id;
                        return (
                            <div key={t.id} className="group relative">
                                <Row
                                    indent={1}
                                    label={t.name}
                                    leading={rowLeading({
                                        kind: "avatar",
                                        letter: t.name.trim().charAt(0).toUpperCase(),
                                        tone: "indigo",
                                    })}
                                    active={isActive}
                                    onClick={() =>
                                        openTeam(RailSurface.Projects, t, projectSlug ?? "")
                                    }
                                />
                                {canManage && (
                                    <button
                                        type="button"
                                        aria-label={`Delete ${t.name}`}
                                        onClick={() => requestDelete(t)}
                                        className={cn(
                                            "absolute top-1/2 right-2 size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-neutral-700/50 hover:text-red-500",
                                            isActive ? "flex" : "hidden group-hover:flex",
                                        )}
                                    >
                                        <Trash2 className="size-3.5" aria-hidden />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {teams.length === 0 && (
                        <p className="py-1.5 pr-2 pl-11 text-[12px] text-neutral-500">
                            No teams yet.
                        </p>
                    )}
                    {isAdmin && (
                        <Row
                            indent={1}
                            label="Add team"
                            leading={{ kind: "icon", icon: Plus }}
                            onClick={openCreateTeam}
                        />
                    )}
                </div>
            )}
        </>
    );
}
