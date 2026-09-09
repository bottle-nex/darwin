"use client";
import type { Editor } from "@tiptap/react";
import { BreadcrumbSeparatorIcon } from "@trydarwin/ui/icons";
import { useState } from "react";

import Disclosure from "@/components/playground/Core/components/Disclosure";
import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { toReferenceText } from "@/components/playground/Home/chat/referenceMention";
import {
    Dialog,
    DIALOG_COMPOSER_SURFACE,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import DialogSubmitButton, { handleDialogSubmitKey } from "@/components/ui/DialogSubmitButton";
import { DIALOG_TITLE_FIELD, GHOST_FIELD } from "@/components/ui/fieldStyles";
import { Textarea } from "@/components/ui/textarea";
import Markdown from "@/components/utility/Markdown";
import { useIssueAttempts } from "@/hooks/issues/useIssueAttempts";
import { useReopenIssue } from "@/hooks/issues/useReopenIssue";
import { useActiveProject } from "@/hooks/useActiveProject";
import { shortDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { BoardIssue } from "@/types/board";

import IssueDescriptionEditor from "./editor/IssueDescriptionEditor";

function errorMessage(error: unknown): string | null {
    const response = (error as { response?: { data?: { message?: string } } })?.response;
    return response?.data?.message ?? null;
}

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
    const { data } = useIssueAttempts(issue.id);
    const [hasNote, setHasNote] = useState(false);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [showDescription, setShowDescription] = useState(false);
    const [showAttempt, setShowAttempt] = useState(false);

    const lastAttempt = data?.attempts.at(-1);
    const ready = hasNote && !reopen.isPending;

    function handleOpenChange(next: boolean) {
        onOpenChange(next);
        if (!next) {
            setHasNote(false);
            setShowDescription(false);
            setShowAttempt(false);
        }
    }

    function submit() {
        if (!ready || !project || !editor) return;
        reopen.mutate(
            { id: issue.id, project_id: project.id, note: toReferenceText(editor) },
            {
                onSuccess: () => handleOpenChange(false),
                onError: (error) =>
                    toast.error(errorMessage(error) ?? "Couldn't reopen this issue."),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => event.preventDefault()}
                className={cn(
                    "flex max-h-[80vh] min-h-[40vh] w-187.5 max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
                    DIALOG_COMPOSER_SURFACE,
                )}
            >
                <DialogTitle className="sr-only">Reopen issue</DialogTitle>

                <main
                    className="z-10 flex min-h-0 min-w-0 flex-1 flex-col justify-between overflow-hidden *:px-6"
                    onKeyDown={(event) => handleDialogSubmitKey(event, submit)}
                >
                    <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                        <div className="flex items-center justify-start gap-x-1 text-xs text-overlay">
                            <PlaygroundAvatar
                                letter={project?.name.slice(0, 2) ?? ""}
                                tone={project ? toneFor(project.id) : "emerald"}
                                icon={project?.icon}
                                className="uppercase"
                            />
                            <span>
                                <BreadcrumbSeparatorIcon />
                            </span>
                            <span className="text-sm">Reopen #{issue.number}</span>
                        </div>
                        <Textarea
                            rows={1}
                            readOnly
                            value={issue.title}
                            className={cn(GHOST_FIELD, DIALOG_TITLE_FIELD)}
                        />
                    </section>

                    <section
                        data-lenis-prevent
                        className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-4"
                    >
                        <IssueDescriptionEditor
                            placeholder="What is still wrong?"
                            mentionProjectId={project?.id}
                            onChange={(state) => setHasNote(!state.isEmpty)}
                            onReady={(instance) => {
                                setEditor(instance);
                                instance.commands.focus("end");
                            }}
                        />
                    </section>

                    <section className="flex flex-col gap-y-3 pb-4">
                        <Disclosure
                            label="Original description"
                            open={showDescription}
                            onOpenChange={setShowDescription}
                        >
                            <div className="max-h-60 overflow-y-auto px-3 py-2" data-lenis-prevent>
                                <IssueDescriptionEditor
                                    editable={false}
                                    placeholder=""
                                    initialContent={issue.description}
                                />
                            </div>
                        </Disclosure>

                        {lastAttempt && (
                            <Disclosure
                                label={`Attempt ${lastAttempt.attemptNumber} · ${shortDate(lastAttempt.startedAt)}`}
                                open={showAttempt}
                                onOpenChange={setShowAttempt}
                            >
                                <div
                                    className="max-h-60 overflow-y-auto px-3 py-2"
                                    data-lenis-prevent
                                >
                                    {lastAttempt.report ? (
                                        <Markdown>{lastAttempt.report}</Markdown>
                                    ) : (
                                        <p className="text-[13px] text-neutral-500">
                                            {lastAttempt.error ?? "This run wrote no report."}
                                        </p>
                                    )}
                                </div>
                            </Disclosure>
                        )}

                        <div className="flex h-fit items-center justify-end">
                            <DialogSubmitButton
                                label="Reopen"
                                onClick={submit}
                                loading={reopen.isPending}
                                disabled={!ready}
                            />
                        </div>
                    </section>
                </main>
            </DialogContent>
        </Dialog>
    );
}
