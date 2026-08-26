"use client";
import { useIssueSelection } from "@/hooks/issues/useIssueSelection";
import { usePaneRouteStore } from "@/store/playground/usePaneRouteStore";
import { type Issue, KanbanStatus } from "@/types/kanban";

import IssueDropdown from "../IssueDropdown";
import CancelledCard from "./CancelledCard";
import DoneCard from "./DoneCard";
import FailedCard from "./FailedCard";
import InProgressCard from "./InProgressCard";
import InReviewCard from "./InReviewCard";
import QueuedCard from "./QueuedCard";
import TodoCard from "./TodoCard";

/** Picks the card component for an issue based on its column. */
function statusCard(issue: Issue) {
    switch (issue.status) {
        case KanbanStatus.Todo:
            return <TodoCard issue={issue} />;
        case KanbanStatus.Queued:
            return <QueuedCard issue={issue} />;
        case KanbanStatus.InProgress:
            return <InProgressCard issue={issue} />;
        case KanbanStatus.InReview:
            return <InReviewCard issue={issue} />;
        case KanbanStatus.Done:
            return <DoneCard issue={issue} />;
        case KanbanStatus.Failed:
            return <FailedCard issue={issue} />;
        case KanbanStatus.Cancelled:
            return <CancelledCard issue={issue} />;
    }
}

/**
 * Renders the status-specific card and opens it on tap. This is the single
 * fan-out point for every column, so wiring the click here covers all statuses.
 * Dragging still works on the To Do column — the board's pointer sensor only
 * starts a drag past a 5px threshold, so a tap falls through to this handler.
 */
export default function CardRenderer({
    issue,
    preview = false,
}: {
    issue: Issue;
    preview?: boolean;
}) {
    const openIssue = usePaneRouteStore((s) => s.openIssue);
    const { isSelected, handleSelectClick } = useIssueSelection("kanban");
    const selected = isSelected(issue.id);

    const open = () => openIssue(issue.id);

    const card = (
        <div
            role="button"
            tabIndex={0}
            data-issue-id={issue.id}
            data-selection-scope="kanban"
            data-selected={selected}
            className="group/card cursor-pointer rounded-md"
            onClick={(event) => {
                if (handleSelectClick(event, issue.id)) return;
                open();
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open();
                }
            }}
        >
            {statusCard(issue)}
        </div>
    );

    if (preview) return card;
    return (
        <IssueDropdown issueId={issue.id} issue={issue.boardIssue}>
            {card}
        </IssueDropdown>
    );
}
