"use client";
import { BreadcrumbSeparatorIcon } from "@trymatcha/ui/icons";
import { useState } from "react";

import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DialogSubmitButton, { handleDialogSubmitKey } from "@/components/ui/DialogSubmitButton";
import { GHOST_FIELD } from "@/components/ui/fieldStyles";
import { Textarea } from "@/components/ui/textarea";
import { useReopenIssue } from "@/hooks/issues/useReopenIssue";
import { useActiveProject } from "@/hooks/useActiveProject";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { BoardIssue } from "@/types/board";

const NOTE_LIMIT = 2000;

export default function ReopenIssueDialog({
    issue,
    open,
    onOpenChange,
}: {
    issue: BoardIssue;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const project = useActiveProject();
    const reopen = useReopenIssue();
    const [note, setNote] = useState("");

    const ready = Boolean(note.trim()) && !reopen.isPending;

    function handleOpenChange(next: boolean) {
        onOpenChange(next);
        if (!next) setNote("");
    }

    function submit() {
        if (!ready || !project) return;
        reopen.mutate(
            { id: issue.id, project_id: project.id, note: note.trim() },
            {
                onSuccess: () => handleOpenChange(false),
                onError: (error) => {
                    const message =
                        error instanceof Error && "response" in error
                            ? ((error as { response?: { data?: { message?: string } } }).response
                                  ?.data?.message ?? null)
                            : null;
                    toast.error(message ?? "Couldn't reopen this issue.");
                },
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "flex w-125 max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
                    "rounded-3xl",
                )}
            >
                <DialogTitle className="sr-only">Reopen issue</DialogTitle>

                <main
                    className="flex min-w-0 flex-col *:px-6"
                    onKeyDown={(event) => handleDialogSubmitKey(event, submit)}
                >
                    <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                        <div className="flex items-center justify-start gap-x-1 text-xs text-snow">
                            <PlaygroundAvatar
                                letter={project?.name.slice(0, 2) ?? ""}
                                tone={project ? toneFor(project.id) : "emerald"}
                                icon={project?.icon}
                                className="uppercase"
                            />
                            <span>
                                <BreadcrumbSeparatorIcon />
                            </span>
                            <span className="text-sm">Another pass on #{issue.number}</span>
                        </div>
                        <p className="text-[13px] text-neutral-400">
                            Say what is still wrong. The agent keeps the commits already on this
                            branch and adds one more answering this.
                        </p>
                        <Textarea
                            rows={4}
                            autoFocus
                            placeholder="The fix drops the trailing slash, so /docs/ still 404s"
                            maxLength={NOTE_LIMIT}
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            className={cn(GHOST_FIELD, "w-full resize-none text-[14px]")}
                        />
                    </section>

                    <section className="flex h-fit items-center justify-end pb-4">
                        <DialogSubmitButton
                            label="Reopen"
                            onClick={submit}
                            loading={reopen.isPending}
                            disabled={!ready}
                        />
                    </section>
                </main>
            </DialogContent>
        </Dialog>
    );
}
