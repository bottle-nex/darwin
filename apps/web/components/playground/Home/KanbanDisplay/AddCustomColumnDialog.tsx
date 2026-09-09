"use client";
import { BreadcrumbSeparatorIcon } from "@trydarwin/ui/icons";
import { useState } from "react";

import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import {
    Dialog,
    DIALOG_COMPOSER_SURFACE,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import DialogSubmitButton, { handleDialogSubmitKey } from "@/components/ui/DialogSubmitButton";
import { DIALOG_TITLE_FIELD, GHOST_FIELD } from "@/components/ui/fieldStyles";
import { Textarea } from "@/components/ui/textarea";
import { useCustomColumnActions } from "@/hooks/kanban/useCustomColumnActions";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { useAddCustomColumnStore } from "@/store/kanban/useAddCustomColumnStore";

export default function AddCustomColumnDialog() {
    const { open, setOpen, targetSpaceId } = useAddCustomColumnStore();
    const project = useActiveProject();
    const { addColumn, addingColumn } = useCustomColumnActions();
    const [title, setTitle] = useState("");

    const ready = Boolean(title.trim()) && Boolean(targetSpaceId) && !addingColumn;

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) setTitle("");
    }

    async function submit() {
        if (!ready || !targetSpaceId) return;
        const added = await addColumn(targetSpaceId, title.trim());
        if (added) handleOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus();
                }}
                className={cn(
                    "flex w-110 max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
                    DIALOG_COMPOSER_SURFACE,
                )}
            >
                <DialogTitle className="sr-only">Add custom column</DialogTitle>

                <main
                    className="flex min-w-0 flex-col *:px-6"
                    onKeyDown={(event) => handleDialogSubmitKey(event, submit)}
                >
                    <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                        <div className="flex items-center justify-start gap-x-1 text-overlay text-xs">
                            <PlaygroundAvatar
                                letter={project?.name.slice(0, 2) ?? ""}
                                tone={project ? toneFor(project.id) : "emerald"}
                                icon={project?.icon}
                                className="uppercase"
                            />
                            <span>
                                <BreadcrumbSeparatorIcon />
                            </span>
                            <span className="text-sm">New List</span>
                        </div>
                        <Textarea
                            rows={1}
                            autoFocus
                            placeholder="List title"
                            maxLength={60}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    submit();
                                }
                            }}
                            className={cn(GHOST_FIELD, DIALOG_TITLE_FIELD)}
                        />
                    </section>

                    <section className="flex h-fit items-center justify-end pb-4">
                        <DialogSubmitButton
                            label="Add list"
                            onClick={submit}
                            loading={addingColumn}
                            disabled={!ready}
                        />
                    </section>
                </main>
            </DialogContent>
        </Dialog>
    );
}
