"use client";

import { useConnectGithub } from "@/hooks/github/useConnectGithub";
import { useUpdateProject } from "@/hooks/project/useUpdateProject";
import { useCreateTeam } from "@/hooks/team/useCreateTeam";
import { slugify } from "@/lib/format";
import type { ProjectDetail } from "@/types/project";
import type { TourDraft } from "./steps";
import OnboardingCore from "./OnboardingCore";

export default function OnboardingDisplay({
    project,
    orgId,
}: {
    project: ProjectDetail;
    orgId: string;
}) {
    const { mutate: updateProject, isPending: updating } = useUpdateProject();
    const { mutate: createTeam, isPending: creatingTeam } = useCreateTeam();
    const { mutate: connectGithub, isPending: connectingGithub } = useConnectGithub();

    const connecting = updating || connectingGithub;
    const completing = updating || creatingTeam;

    const initialDraft: TourDraft = {
        title: project.name,
        summary: project.summary ?? "",
        description: project.description ?? "",
        teamName: "",
    };

    const draftFields = (draft: TourDraft) => ({
        project_id: project.id,
        name: draft.title.trim() || undefined,
        summary: draft.summary.trim() || undefined,
        description: draft.description.trim() || undefined,
    });

    const handleComplete = (draft: TourDraft) => {
        if (completing) return;
        updateProject({ ...draftFields(draft), tour_completed: true });
        const teamName = draft.teamName.trim();
        if (teamName) {
            createTeam({ projectId: project.id, name: teamName, slug: slugify(teamName) });
        }
    };

    const handleConnectGithub = (draft: TourDraft) => {
        if (connecting) return;
        updateProject(draftFields(draft), { onSuccess: () => connectGithub(orgId) });
    };

    return (
        <main className="relative z-10 flex flex-1 min-w-0 flex-col overflow-hidden rounded-lg ring-1 ring-white/6 bg-[#0F0F10]">
            <OnboardingCore
                initialDraft={initialDraft}
                repoFullName={project.githubRepoFullName}
                completing={completing}
                connecting={connecting}
                onComplete={handleComplete}
                onConnectGithub={handleConnectGithub}
            />
        </main>
    );
}
