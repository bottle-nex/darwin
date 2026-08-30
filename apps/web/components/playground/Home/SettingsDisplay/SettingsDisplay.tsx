"use client";
import { AccessRestrictedIcon } from "@trymatcha/ui/icons";
import { useParams } from "next/navigation";

import NoResource from "@/components/utility/NoResource";
import ProjectsGlyph from "@/components/utility/ProjectsGlyph";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetProject } from "@/hooks/project/useGetProject";

import AIHarnessSettingsSection from "./AIHarnessSettingsSection";
import IntegrationsDisplay from "./integrations/IntegrationsDisplay";
import ProjectSettingsEnvSection from "./ProjectSettingsEnvSection";
import ProjectSettingsGeneralSection from "./ProjectSettingsGeneralSection";
import SettingsPaneShell from "./SettingsPaneShell";
import IssueTemplatesDisplay from "./templates/IssueTemplatesDisplay";

export type ProjectSettingsSection = "project" | "env" | "templates" | "harness" | "integrations";

function RestrictedNotice() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-charcoal text-neutral-300 ring-1 ring-white/10">
                <AccessRestrictedIcon className="size-5" aria-hidden />
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

export default function SettingsDisplay({ section }: { section: ProjectSettingsSection }) {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = projectSlug
        ? dashboard?.projects.find((p) => p.slug === projectSlug)
        : undefined;
    const projectId = activeProject?.id;

    const { data: project } = useGetProject(projectId);

    if (!projectId) {
        return (
            <SettingsPaneShell sectionKey="no-project">
                <NoResource
                    className="mt-12"
                    icon={<ProjectsGlyph className="size-24" />}
                    title="No project selected"
                    description="Project settings need an open project. Pick one from the switcher, or use the account settings above to change how the workspace looks for you."
                />
            </SettingsPaneShell>
        );
    }

    if (!project) {
        return <div className="flex-1" />;
    }

    const canManage = project.viewerRole === "Admin" || project.viewerRole === "Maintain";
    if (!canManage) {
        return <RestrictedNotice />;
    }

    const isAdmin = project.viewerRole === "Admin";
    const currentProject = project;

    function getSection() {
        switch (section) {
            case "env":
                return <ProjectSettingsEnvSection projectId={projectId} />;
            case "templates":
                return <IssueTemplatesDisplay projectId={projectId} />;
            case "project":
                return (
                    <ProjectSettingsGeneralSection
                        key={currentProject.id}
                        project={currentProject}
                        isAdmin={isAdmin}
                        orgSlug={orgSlug ?? ""}
                    />
                );
            case "harness":
                return <AIHarnessSettingsSection projectId={currentProject.id} isAdmin={isAdmin} />;
            case "integrations":
                return <IntegrationsDisplay project={currentProject} />;
        }
    }

    return (
        <SettingsPaneShell sectionKey={section} wide={section === "integrations"}>
            {getSection()}
        </SettingsPaneShell>
    );
}
