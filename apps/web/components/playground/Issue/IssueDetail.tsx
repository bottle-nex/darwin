"use client";
import { BsChatRightText } from "react-icons/bs";
import type { BoardColumn, BoardIssue } from "@/types/board";
import { useIssueChatPanelStore } from "@/store/issues/useIssueChatPanelStore";
import OptionButton from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/OptionButton";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import IssueDropdown from "@/components/playground/Home/KanbanDisplay/IssueDropdown";
import IssueTitleField from "./IssueTitleField";
import IssueBody from "./IssueBody";
import IssueSubmitAction from "./IssueSubmitAction";
import IssueProperties from "./IssueProperties";
import ActivityFeed from "./activity/ActivityFeed";
import IssueChatPanel from "./chat/IssueChatPanel";
import { isEditable, targetForIssue } from "./issueHelpers";
import { useIssueForm } from "./useIssueForm";

export default function IssueDetail({
    issue,
    columns,
}: {
    issue: BoardIssue;
    columns: BoardColumn[];
}) {
    const chatOpen = useIssueChatPanelStore((s) => s.isOpen);
    const toggleChat = useIssueChatPanelStore((s) => s.toggle);

    const form = useIssueForm({
        target: targetForIssue(issue, columns),
        issue,
        initialDescription: issue.description,
        readOnly: !isEditable(issue),
    });

    return (
        <IssueDropdown issueId={issue.id}>
            <main className={PLAYGROUND_PANE_SHELL}>
                <PaneLeadSlot>
                    <PlaygroundBreadcrumb issueNumber={issue.number} />
                </PaneLeadSlot>

                <PaneActionsSlot>
                    <div className="flex items-center gap-x-2">
                        <TooltipComponent delayDuration={1000} content="Comments" side="bottom">
                            <OptionButton
                                label="Comments"
                                icon={BsChatRightText}
                                active={chatOpen}
                                onClick={toggleChat}
                            />
                        </TooltipComponent>
                        <IssueSubmitAction form={form} warningPlacement="below" />
                    </div>
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
                    <IssueChatPanel issueId={issue.id} />
                </div>
            </main>
        </IssueDropdown>
    );
}
