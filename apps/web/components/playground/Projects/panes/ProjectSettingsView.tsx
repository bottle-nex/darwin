"use client";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../iconrail/railSurface";
import { ProjectsTab } from "../projectsTabs";
import ProjectSettingsGeneralSection from "./settings/ProjectSettingsGeneralSection";
import ProjectSettingsTeamSection from "./settings/ProjectSettingsTeamSection";
import ProjectSettingsMemberSection from "./settings/ProjectSettingsMemberSection";
import ProjectSettingsEnvSection from "./settings/ProjectSettingsEnvSection";

/**
 * Main pane for project settings. The section nav now lives in the sidebar
 * (`ProjectSettingsNav`); this view just renders the section the active Projects
 * tab points at, gated on the viewer being able to manage the project.
 */
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

    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Projects]);

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
        switch (tab) {
            case ProjectsTab.SettingsTeams:
                return (
                    <ProjectSettingsTeamSection
                        project={activeProjectDetail}
                        isAdmin={isAdmin}
                        canManage={canManage}
                    />
                );
            case ProjectsTab.SettingsMembers:
                return <ProjectSettingsMemberSection projectId={projectId} />;
            case ProjectsTab.SettingsEnv:
                return <ProjectSettingsEnvSection projectId={projectId} />;
            case ProjectsTab.SettingsProject:
            default:
                return (
                    <ProjectSettingsGeneralSection
                        key={activeProjectDetail.id}
                        project={activeProjectDetail}
                        isAdmin={isAdmin}
                        orgSlug={orgSlug ?? ""}
                    />
                );
        }
    }

    return (
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <motion.div
                key={tab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                className="mx-auto w-full max-w-2xl"
            >
                {renderContent()}
            </motion.div>
        </div>
    );
}
