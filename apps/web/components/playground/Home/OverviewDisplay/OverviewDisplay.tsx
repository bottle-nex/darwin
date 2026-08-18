"use client";
import { MotionConfig, motion } from "motion/react";
import { toast } from "@/lib/toast";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useUpdateProject } from "@/hooks/project/useUpdateProject";
import { useStartSetup } from "@/hooks/project/useStartSetup";
import type { ProjectOverview } from "@/types/overview";
import OverviewOptionsBar from "./OverviewOptionsBar";
import OverviewMasthead from "./OverviewMasthead";
import AgentBrief from "./AgentBrief";
import AgentBriefEmpty from "./AgentBriefEmpty";
import SurfaceLinks from "./SurfaceLinks";
import TeamSection from "./TeamSection";
import { STAGGER_VARIANTS } from "./overviewTheme";

function projectKey(slug: string) {
    return slug.replace(/-/g, "").slice(0, 3).toUpperCase();
}

export default function OverviewDisplay() {
    const activeProject = useActiveProject();
    const { data: project } = useGetProject(activeProject?.id);
    const { data: members } = useProjectMembers(activeProject?.id);
    const updateProject = useUpdateProject();
    const startSetup = useStartSetup();

    if (!project) return null;

    const markdown = project.planMd ?? "";
    const briefReady = project.planStatus === "Ready" && Boolean(project.planMd);

    const overview: ProjectOverview = {
        key: projectKey(project.slug),
        repo: project.githubRepoFullName ?? "",
        name: project.name,
        purpose: project.summary ?? "",
        description: project.description ?? "",
        brief: { markdown, updatedAt: project.planGeneratedAt ?? project.updatedAt },
        links: project.githubRepoUrl
            ? [
                  {
                      id: "repo",
                      kind: "github",
                      label: "Repository",
                      url: project.githubRepoUrl,
                  },
              ]
            : [],
        leadId: project.ownerId,
        team: members ?? [],
        status: "active",
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    };

    async function saveBrief(next: string) {
        try {
            await updateProject.mutateAsync({ project_id: project!.id, plan_md: next });
            toast.success("Brief updated.");
            return true;
        } catch {
            toast.error("Couldn't save the brief.");
            return false;
        }
    }

    function generateBrief() {
        startSetup.mutate(project!.id, {
            onError: () => toast.error("Couldn't start brief generation."),
        });
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <OverviewOptionsBar briefMarkdown={markdown} />

            <div data-lenis-prevent className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                <MotionConfig reducedMotion="user">
                    <motion.div
                        variants={STAGGER_VARIANTS}
                        initial="hidden"
                        animate="show"
                        className="mx-auto flex w-full max-w-200 flex-col gap-10 px-6 py-10"
                    >
                        <div className="flex flex-col gap-5">
                            <SurfaceLinks links={overview.links} />
                            <OverviewMasthead overview={overview} />
                        </div>

                        {briefReady ? (
                            <AgentBrief
                                markdown={markdown}
                                updatedAt={overview.brief.updatedAt}
                                saving={updateProject.isPending}
                                onSave={saveBrief}
                            />
                        ) : (
                            <AgentBriefEmpty
                                status={project.planStatus}
                                repoFullName={project.githubRepoFullName}
                                branch={project.githubDefaultBranch}
                                onGenerate={generateBrief}
                                starting={startSetup.isPending}
                            />
                        )}

                        <TeamSection team={overview.team} leadId={overview.leadId} />
                    </motion.div>
                </MotionConfig>
            </div>
        </div>
    );
}
