"use client";
import { useState } from "react";
import type { BoardColumn, BoardIssue } from "@/types/board";
import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import IssueDropdown from "@/components/playground/Home/KanbanDisplay/IssueDropdown";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import IssueTitleField from "./IssueTitleField";
import IssueBody from "./IssueBody";
import IssueSubmitAction from "./IssueSubmitAction";
import IssueProperties from "./IssueProperties";
import ActivityFeed from "./activity/ActivityFeed";
import { isEditable, targetForIssue } from "./issueHelpers";
import { useIssueRoute } from "./useIssueRoute";
import { useIssueForm } from "./useIssueForm";

export default function IssueDetail({
    issue,
    columns,
}: {
    issue: BoardIssue;
    columns: BoardColumn[];
}) {
    const { close } = useIssueRoute();
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

    return (
        <IssueDropdown issueId={issue.id}>
            <main className={PLAYGROUND_PANE_SHELL}>
                <PaneLeadSlot>
                    <PlaygroundBreadcrumb issueNumber={issue.number} />
                </PaneLeadSlot>

                <PaneActionsSlot>
                    <IssueSubmitAction form={form} warningPlacement="below" />
                </PaneActionsSlot>
                <div className="flex min-h-0 min-w-0 flex-1 flex-row m-4">
                    <div className="flex min-h-0 w-full min-w-0 max-w-200 flex-col">
                        <div
                            data-lenis-prevent
                            className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-10 py-8"
                        >
                            <div className="flex w-full flex-col gap-y-4">
                                <div onContextMenu={(event) => event.stopPropagation()}>
                                    <IssueTitleField form={form} />
                                </div>
                                <div onContextMenu={(event) => event.stopPropagation()}>
                                    <IssueBody form={form} />
                                </div>
                                <div className="h-px w-full bg-white/7" />
                                <ActivityFeed issueId={issue.id} />
                            </div>
                        </div>
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
