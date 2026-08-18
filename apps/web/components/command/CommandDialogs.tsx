"use client";
import CreateTagDialog from "@/components/playground/Home/TagsDisplay/CreateTagDialog";
import CreateOrganizationModal from "@/components/playground/landing/CreateOrganizationModal";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";
import SwitchOrganizationDialog from "./SwitchOrganizationDialog";
import SwitchProjectDialog from "./SwitchProjectDialog";
import SwitchTeamDialog from "./SwitchTeamDialog";
import DeleteTagPickerDialog from "./DeleteTagPickerDialog";
import DeleteTeamPickerDialog from "./DeleteTeamPickerDialog";
import DeleteProjectPickerDialog from "./DeleteProjectPickerDialog";
import DeleteTagDialog from "./DeleteTagDialog";
import DeleteProjectDialog from "./DeleteProjectDialog";
import DeleteIssueDialog from "./DeleteIssueDialog";

export default function CommandDialogs() {
    const pending = useCommandActionStore((s) => s.pending);
    const clear = useCommandActionStore((s) => s.clear);
    const projectId = useActiveProject()?.id;

    return (
        <>
            {projectId && (
                <CreateTagDialog
                    open={pending === "new-tag"}
                    onOpenChange={(next) => !next && clear()}
                    projectId={projectId}
                />
            )}
            <CreateOrganizationModal
                open={pending === "new-organization"}
                onOpenChange={(next) => !next && clear()}
            />

            <SwitchOrganizationDialog />
            <SwitchProjectDialog />
            <SwitchTeamDialog />

            <DeleteTagPickerDialog />
            <DeleteTeamPickerDialog />
            <DeleteProjectPickerDialog />

            <DeleteTagDialog />
            <DeleteProjectDialog />
            <DeleteIssueDialog />
        </>
    );
}
