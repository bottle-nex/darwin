"use client";
import { BreadcrumbSeparatorIcon } from "@trymatcha/ui/icons";
import { useState } from "react";

import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DIALOG_TITLE_FIELD, GHOST_FIELD } from "@/components/ui/fieldStyles";
import { Textarea } from "@/components/ui/textarea";
import { useChapterActions } from "@/hooks/kanban/useChapterActions";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import { useNewChapterStore } from "@/store/chapter/useNewChapterStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

export default function CreateChapterDialog({ projectSlug }: { projectSlug: string }) {
    const { open, setOpen } = useNewChapterStore();
    const project = useActiveProject();
    const openChapter = usePlaygroundNavStore((s) => s.openChapter);
    const { addChapter, addingChapter } = useChapterActions();
    const [name, setName] = useState("");

    const ready = Boolean(name.trim()) && !addingChapter;

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) setName("");
    }

    async function submit() {
        if (!ready) return;
        const chapter = await addChapter(name);
        if (!chapter) return;
        openChapter(chapter, projectSlug);
        handleOpenChange(false);
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
                    "rounded-3xl bg-charcoal",
                )}
            >
                <DialogTitle className="sr-only">Create chapter</DialogTitle>

                <main className="flex min-w-0 flex-col *:px-6">
                    <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                        <div className="flex items-center justify-start gap-x-1 text-snow text-xs">
                            <PlaygroundAvatar
                                letter={project?.name.slice(0, 2) ?? ""}
                                tone={project ? toneFor(project.id) : "emerald"}
                                icon={project?.icon}
                                className="uppercase"
                            />
                            <span>
                                <BreadcrumbSeparatorIcon />
                            </span>
                            <span className="text-sm">New Chapter</span>
                        </div>
                        <Textarea
                            rows={1}
                            autoFocus
                            placeholder="Chapter name"
                            maxLength={60}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                        <Button
                            type="button"
                            variant="tertiary"
                            size="xs"
                            className="text-ink!"
                            onClick={submit}
                            loading={addingChapter}
                            disabled={!ready}
                        >
                            Add chapter
                        </Button>
                    </section>
                </main>
            </DialogContent>
        </Dialog>
    );
}
