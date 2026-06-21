import { KanbanStatus, type Issue } from "../types";
import TodoCard from "./TodoCard";
import QueuedCard from "./QueuedCard";
import InProgressCard from "./InProgressCard";
import InReviewCard from "./InReviewCard";
import DoneCard from "./DoneCard";
import FailedCard from "./FailedCard";
import CancelledCard from "./CancelledCard";

/** Picks the card component for an issue based on its column. */
export default function CardRenderer({ issue }: { issue: Issue }) {
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
