"use client";
import { useState } from "react";

import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import PaneColumns from "@/components/playground/Core/components/PaneColumns";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import { PANE_TOP_BAR_HEIGHT } from "@/components/playground/Core/components/PlaygroundPaneFrame";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import IssueDropdown from "@/components/playground/Home/KanbanDisplay/IssueDropdown";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import type { BoardColumn, BoardIssue } from "@/types/board";

import IssueDetailBody from "./IssueDetailBody";
import { isEditable, targetForIssue } from "./issueHelpers";
import IssueProperties from "./IssueProperties";
import IssueSubmitAction from "./IssueSubmitAction";
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
    const openBoard = usePaneRouteStore((s) => s.openBoard);
    const identifier = useIssueIdentifier();
    const close = onDismiss ?? openBoard;
    const [confirmingClose, setConfirmingClose] = useState(false);

    const form = useIssueForm({
        target: targetForIssue(issue, columns),
        issue,
        initialDescription: issue.description,
        readOnly: !isEditable(issue),
    });

    const { isDirty } = form;

    useEscapeExit({
        enabled: !confirmingClose,
        isDirty,
        editor: form.editorRef.current,
        onExit: close,
        onDirtyExit: () => setConfirmingClose(true),
    });

    async function saveAndClose() {
        if (await form.submit()) close();
    }

    function discardAndClose() {
        form.discardDraft();
        close();
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
                            {identifier(issue.number)}
                        </span>
                        <IssueSubmitAction form={form} warningPlacement="below" />
                    </div>
                ) : (
                    <>
                        <PaneLeadSlot>
                            <PlaygroundBreadcrumb issue={issue} />
                        </PaneLeadSlot>

                        <PaneActionsSlot>
                            <IssueSubmitAction form={form} warningPlacement="below" />
                        </PaneActionsSlot>
                    </>
                )}
                <PaneColumns tight={embedded} aside={<IssueProperties form={form} issue={issue} />}>
                    <IssueDetailBody form={form} issueId={issue.id} embedded={embedded} />
                </PaneColumns>
                <ConfirmDialog
                    open={confirmingClose}
                    onOpenChange={setConfirmingClose}
                    title="Save your changes?"
                    description="This issue has unsaved edits. Closing it now will lose them."
                    cancel={{ label: "Discard", variant: "destructive", onClick: discardAndClose }}
                    confirm={{ label: "Save", variant: "tertiary", onClick: saveAndClose }}
                    pending={form.pending}
                />
            </main>
        </IssueDropdown>
    );
}
