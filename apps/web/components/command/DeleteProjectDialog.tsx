"use client";
import { useParams, useRouter } from "next/navigation";

import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useDeleteProject } from "@/hooks/project/useDeleteProject";
import { toast } from "@/lib/toast";
import { useDeleteProjectStore } from "@/store/project/useDeleteProjectStore";

export default function DeleteProjectDialog() {
    const router = useRouter();
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { project, close } = useDeleteProjectStore();
    const deleteProject = useDeleteProject();

    function dismiss() {
        close();
        deleteProject.reset();
    }

    function confirmDelete() {
        if (!project) return;
        deleteProject.mutate(project.id, {
            onSuccess: () => {
                toast.success("Project deleted.");
                close();
                if (project.slug === projectSlug) router.push(`/playground/${orgSlug}`);
            },
        });
    }

    return (
        <ConfirmDialog
            open={project !== null}
            onOpenChange={(next) => !next && dismiss()}
            title="Delete project?"
            description={
                <>
                    This permanently deletes{" "}
                    <span className="font-medium text-neutral-200">{project?.name}</span> along with
                    its board, teams, and tags. Everyone loses access immediately and this
                    can&apos;t be undone.
                </>
            }
            cancel={{ label: "Cancel", variant: "tertiary", onClick: dismiss }}
            confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
            pending={deleteProject.isPending}
            typeToConfirm={project?.slug}
            error={deleteProject.isError ? "Couldn't delete the project. Try again." : undefined}
        />
    );
}
