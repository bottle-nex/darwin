"use client";
import { useOpenIssue } from "@/components/playground/issue/useOpenIssue";
import { KanbanStatus, type Issue } from "../types";
import TodoCard from "./TodoCard";
import QueuedCard from "./QueuedCard";
import InProgressCard from "./InProgressCard";
import InReviewCard from "./InReviewCard";
import DoneCard from "./DoneCard";
import FailedCard from "./FailedCard";
import CancelledCard from "./CancelledCard";

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
 * Renders the status-specific card and makes it open the issue's detail dialog on
 * tap. This is the single fan-out point for every column, so wiring the click here
 * covers all statuses. Dragging still works on the To Do column — the board's
 * pointer sensor only starts a drag past a 5px threshold, so a tap falls through
 * to this handler.
 */
export default function CardRenderer({ issue }: { issue: Issue }) {
    const { openIssue } = useOpenIssue();
    return (
        <div
            role="button"
            tabIndex={0}
            className="cursor-pointer"
            onClick={() => openIssue(issue.id)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openIssue(issue.id);
                }
            }}
        >
            {statusCard(issue)}
        </div>
    );
}
