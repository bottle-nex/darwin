"use client";
import { useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { toast } from "sonner";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useGetProject } from "@/hooks/project/useGetProject";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { dummyProjectOverview } from "@/data/dummy-project-overview";
import type { ProjectOverview } from "@/types/overview";
import OverviewOptionsBar from "./OverviewOptionsBar";
import OverviewMasthead from "./OverviewMasthead";
import AgentBrief from "./AgentBrief";
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
    const [markdown, setMarkdown] = useState(dummyProjectOverview.brief.markdown);

    if (!project) return null;

    const overview: ProjectOverview = {
        key: projectKey(project.slug),
        repo: project.githubRepoFullName ?? "",
        name: project.name,
        purpose: project.summary ?? "",
        description: project.description ?? "",
        brief: { markdown, updatedAt: project.updatedAt },
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

    function saveBrief(next: string) {
        setMarkdown(next);
        toast.success("Brief updated.");
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

                        <AgentBrief
                            markdown={markdown}
                            updatedAt={overview.brief.updatedAt}
                            onSave={saveBrief}
                        />

                        <TeamSection team={overview.team} leadId={overview.leadId} />
                    </motion.div>
                </MotionConfig>
            </div>
        </div>
    );
}
