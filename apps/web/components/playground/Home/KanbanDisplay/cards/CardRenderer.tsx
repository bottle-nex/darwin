"use client";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { KanbanStatus, type Issue } from "@/types/kanban";
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
 * Renders the status-specific card and opens it on tap. This is the single
 * fan-out point for every column, so wiring the click here covers all statuses.
 * In-Review cards open the Reviews display (their PR is awaiting sign-off);
 * every other status opens the issue dialog. Dragging still works on the To Do
 * column — the board's pointer sensor only starts a drag past a 5px threshold,
 * so a tap falls through to this handler.
 */
export default function CardRenderer({ issue }: { issue: Issue }) {
    const { openEdit } = useIssueDialog();
    const setTab = usePlaygroundNavStore((s) => s.setTab);

    const open =
        issue.status === KanbanStatus.InReview
            ? () => setTab(PlaygroundTab.Reviews)
            : () => openEdit(issue.id);

    return (
        <div
            role="button"
            tabIndex={0}
            data-issue-id={issue.id}
            className="cursor-pointer"
            onClick={open}
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
}
