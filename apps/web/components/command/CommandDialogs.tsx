"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import CreateTagDialog from "@/components/playground/Home/TagsDisplay/CreateTagDialog";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCommandActionStore } from "@/store/command/useCommandActionStore";

import DeleteIssueDialog from "./DeleteIssueDialog";
import DeleteProjectDialog from "./DeleteProjectDialog";
import DeleteProjectPickerDialog from "./DeleteProjectPickerDialog";
import DeleteTagDialog from "./DeleteTagDialog";
import DeleteTagPickerDialog from "./DeleteTagPickerDialog";
import DeleteTeamPickerDialog from "./DeleteTeamPickerDialog";
import SwitchOrganizationDialog from "./SwitchOrganizationDialog";
import SwitchProjectDialog from "./SwitchProjectDialog";
import SwitchTeamDialog from "./SwitchTeamDialog";

export default function CommandDialogs() {
    const pending = useCommandActionStore((s) => s.pending);
    const clear = useCommandActionStore((s) => s.clear);
    const projectId = useActiveProject()?.id;
    const router = useRouter();

    useEffect(() => {
        if (pending !== "new-organization") return;
        clear();
        router.push("/workspace");
    }, [pending, clear, router]);

    return (
        <>
            {projectId && (
                <CreateTagDialog
                    open={pending === "new-tag"}
                    onOpenChange={(next) => !next && clear()}
                    projectId={projectId}
                />
            )}

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
