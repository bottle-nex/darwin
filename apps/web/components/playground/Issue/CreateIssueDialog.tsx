"use client";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { useIssueStore } from "@/store/issues/useIssueStore";
import type { IssueTarget } from "@/store/issues/useIssueStore";
import CreateIssueForm from "./CreateIssueForm";

export default function CreateIssueDialog() {
    const mode = useIssueStore((s) => s.mode);
    const close = useIssueStore((s) => s.close);

    if (mode?.kind !== "create") return null;
    return (
        <Dialog open onOpenChange={close}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus();
                }}
                className={cn(
                    "flex flex-col max-h-[80vh] min-h-[40vh] w-187.5 max-w-none sm:max-w-none p-0 gap-0 overflow-hidden",
                    "bg-charcoal rounded-3xl",
                )}
            >
                <CreateIssue target={mode.target} onCreated={close} />
            </DialogContent>
        </Dialog>
    );
}

function CreateIssue({ target, onCreated }: { target: IssueTarget; onCreated: () => void }) {
    const projectId = useActiveProject()?.id;
    const { data: templates } = useListTemplates(projectId);

    return (
        <CreateIssueForm
            target={target}
            initialTemplate={templates?.find((template) => template.isDefault)}
            onCreated={onCreated}
        />
    );
}
