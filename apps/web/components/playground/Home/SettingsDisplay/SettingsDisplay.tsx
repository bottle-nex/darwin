"use client";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { MdLock } from "react-icons/md";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { Surface } from "../../Sidebar/surface";
import { ProjectsTab } from "../../Projects/projectsTabs";
import ProjectSettingsGeneralSection from "./ProjectSettingsGeneralSection";
import ProjectSettingsTeamSection from "./ProjectSettingsTeamSection";
import ProjectSettingsMemberSection from "./ProjectSettingsMemberSection";
import ProjectSettingsEnvSection from "./ProjectSettingsEnvSection";
import IssueTemplatesDisplay from "./templates/IssueTemplatesDisplay";

export type ProjectSettingsSection = "project" | "teams" | "members" | "env" | "templates";

/** Maps a Projects settings tab to its section, for the store-driven fallback. */
const TAB_SECTION: Partial<Record<ProjectsTab, ProjectSettingsSection>> = {
    [ProjectsTab.SettingsTeams]: "teams",
    [ProjectsTab.SettingsMembers]: "members",
    [ProjectsTab.SettingsEnv]: "env",
    [ProjectsTab.SettingsProject]: "project",
};

/**
 * Main pane for project settings. The section nav lives in the sidebar; this
 * view renders one section, gated on the viewer being able to manage the
 * project. The section is taken from the `section` prop when given (Home
 * surface), else derived from the active Projects tab.
 */
export default function SettingsDisplay({ section }: { section?: ProjectSettingsSection }) {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const projectId = activeProject?.id;

    const { data: project } = useGetProject(projectId);
    const canManage = project?.viewerRole === "Admin" || project?.viewerRole === "Maintain";
    const isAdmin = project?.viewerRole === "Admin";

    const tab = usePlaygroundNavStore((s) => s.tabBySurface[Surface.Projects]);
    const activeSection: ProjectSettingsSection =
        section ?? TAB_SECTION[tab as ProjectsTab] ?? "project";

    if (!project) {
        return <div className="flex-1" />;
    }

    if (!canManage) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-charcoal text-neutral-300 ring-1 ring-white/10">
                    <MdLock className="size-5" aria-hidden />
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
        switch (activeSection) {
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
            case "templates":
                return <IssueTemplatesDisplay projectId={projectId} />;
            case "project":
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
                key={activeSection}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                className="mx-auto h-full w-full max-w-200"
            >
                {renderContent()}
            </motion.div>
        </div>
    );
}
