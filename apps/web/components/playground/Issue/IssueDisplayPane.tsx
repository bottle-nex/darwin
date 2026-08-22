"use client";
import { useState } from "react";
import type { BoardColumn, BoardIssue } from "@/types/board";
import { cn } from "@/lib/utils";
import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PANE_TOP_BAR_HEIGHT } from "@/components/playground/Core/components/PlaygroundPaneFrame";
import IssueDropdown from "@/components/playground/Home/KanbanDisplay/IssueDropdown";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import DiffDisplay from "./diff/DiffDisplay";
import IssueDetailBody from "./IssueDetailBody";
import IssueProperties from "./IssueProperties";
import IssueSubmitAction from "./IssueSubmitAction";
import { isEditable, targetForIssue } from "./issueHelpers";
import { useIssueNavigation } from "./useIssueNavigation";
import { useIssueRoute } from "./useIssueRoute";
import { useIssueForm } from "./useIssueForm";

export default function IssueDisplayPane({
    issue,
    columns,
    embedded = false,
    onDismiss,
}: {
    issue: BoardIssue;
    columns: BoardColumn[];
    embedded?: boolean;
    onDismiss?: () => void;
}) {
    const { close: closeRoute, showIssueDetail } = useIssueNavigation();
    const { issueView } = useIssueRoute();
    const close = onDismiss ?? closeRoute;
    const [confirmingClose, setConfirmingClose] = useState(false);
    const inDiff = !embedded && issueView === "diff";

    const form = useIssueForm({
        target: targetForIssue(issue, columns),
        issue,
        initialDescription: issue.description,
        readOnly: !isEditable(issue),
    });

    const { isDirty } = form;

    useEscapeExit({
        enabled: !confirmingClose,
        isDirty: inDiff ? false : isDirty,
        editor: form.editorRef.current,
        onExit: inDiff ? showIssueDetail : close,
        onDirtyExit: () => setConfirmingClose(true),
    });

    async function saveAndClose() {
        if (await form.submit()) close();
    }

    return (
        <IssueDropdown issueId={issue.id} issue={issue}>
            <main className={PLAYGROUND_PANE_SHELL}>
                {embedded ? (
                    <div
                        style={{ height: PANE_TOP_BAR_HEIGHT }}
                        className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3"
                    >
                        <span className="text-[12.5px] font-medium text-neutral-400 tabular-nums">
                            #{issue.number}
                        </span>
                        <IssueSubmitAction form={form} warningPlacement="below" />
                    </div>
                ) : (
                    <>
                        <PaneLeadSlot>
                            <PlaygroundBreadcrumb
                                issue={issue}
                                trailing={inDiff ? "Diff" : undefined}
                            />
                        </PaneLeadSlot>

                        {!inDiff && (
                            <PaneActionsSlot>
                                <IssueSubmitAction form={form} warningPlacement="below" />
                            </PaneActionsSlot>
                        )}
                    </>
                )}
                <div
                    className={cn(
                        "grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,50rem)_16rem]",
                        embedded ? "m-2" : "m-4",
                    )}
                >
                    <div className="flex min-h-0 min-w-0 flex-col">
                        {inDiff ? (
                            <DiffDisplay issue={issue} />
                        ) : (
                            <IssueDetailBody form={form} issueId={issue.id} embedded={embedded} />
                        )}
                    </div>
                    <IssueProperties form={form} issue={issue} />
                </div>
                <ConfirmDialog
                    open={confirmingClose}
                    onOpenChange={setConfirmingClose}
                    title="Save your changes?"
                    description="This issue has unsaved edits. Closing it now will lose them."
                    cancel={{ label: "Discard", variant: "destructive", onClick: close }}
                    confirm={{ label: "Save", variant: "tertiary", onClick: saveAndClose }}
                    pending={form.pending}
                />
            </main>
        </IssueDropdown>
    );
}
