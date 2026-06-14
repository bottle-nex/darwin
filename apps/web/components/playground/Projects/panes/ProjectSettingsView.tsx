"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, KeyRound, Lock, Pencil, Users, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { ProjectsTab } from "../projectsTabs";
import ProjectSettingsGeneralSection from "./settings/ProjectSettingsGeneralSection";
import ProjectSettingsTeamSection from "./settings/ProjectSettingsTeamSection";
import ProjectSettingsMemberSection from "./settings/ProjectSettingsMemberSection";
import ProjectSettingsEnvSection from "./settings/ProjectSettingsEnvSection";

type Section = "project" | "teams" | "members" | "env";

export default function ProjectSettingsView() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const projectId = activeProject?.id;

    const { data: project } = useGetProject(projectId);
    const canManage = project?.viewerRole === "Admin" || project?.viewerRole === "Maintain";
    const isAdmin = project?.viewerRole === "Admin";

    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const [section, setSection] = useState<Section>("project");

    const NAV: { id: Section; label: string; icon: typeof Pencil }[] = [
        { id: "project", label: "Project", icon: Pencil },
        { id: "teams", label: "Teams", icon: UsersRound },
        { id: "members", label: "Members", icon: Users },
        { id: "env", label: "Environment variables", icon: KeyRound },
    ];

    if (!project) {
        return <div className="flex-1" />;
    }

    if (!canManage) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-charcoal text-neutral-300 ring-1 ring-white/10">
                    <Lock className="size-5" aria-hidden />
                </span>
                <h2 className="mt-4 text-[13px] font-semibold text-neutral-100">
                    Settings are restricted
                </h2>
                <p className="mt-1 max-w-sm text-[12px] text-neutral-500">
                    You need Admin or Maintain access on this project to manage its settings.
                </p>
            </div>
        );
    }

    // Narrowed once above; capture into a const so the type holds inside the closure.
    const activeProjectDetail = project;

    function renderContent() {
        switch (section) {
            case "project":
                return (
                    <ProjectSettingsGeneralSection
                        key={activeProjectDetail.id}
                        project={activeProjectDetail}
                        isAdmin={isAdmin}
                        orgSlug={orgSlug ?? ""}
                    />
                );
            case "teams":
                return (
                    <ProjectSettingsTeamSection
                        project={activeProjectDetail}
                        isAdmin={isAdmin}
                        canManage={canManage}
                    />
                );
            case "members":
                return <ProjectSettingsMemberSection projectId={projectId} />;
            case "env":
                return <ProjectSettingsEnvSection projectId={projectId} />;
        }
    }

    return (
        <div className="flex min-h-0 flex-1">
            {/* Left panel */}
            <nav className="w-52 shrink-0 border-r border-white/5 p-2.5">
                <button
                    type="button"
                    onClick={() => setTab(RailSurface.Projects, ProjectsTab.Overview)}
                    className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                >
                    <ArrowLeft className="size-3 shrink-0" aria-hidden />
                    <span className="truncate">Back</span>
                </button>
                {NAV.map((item) => {
                    const dividerBefore = item.id === "env";
                    return (
                        <div key={item.id}>
                            {dividerBefore && <div className="my-2 h-px bg-white/5" />}
                            <button
                                type="button"
                                onClick={() => setSection(item.id)}
                                className={cn(
                                    "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px]",
                                    section === item.id
                                        ? "bg-white/10 text-neutral-100"
                                        : "text-neutral-300 hover:bg-white/5 hover:text-neutral-100",
                                )}
                            >
                                <item.icon className="size-3 shrink-0" aria-hidden />
                                <span className="truncate">{item.label}</span>
                            </button>
                        </div>
                    );
                })}
            </nav>

            {/* Content */}
            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mx-auto w-full max-w-2xl">{renderContent()}</div>
            </div>
        </div>
    );
}
