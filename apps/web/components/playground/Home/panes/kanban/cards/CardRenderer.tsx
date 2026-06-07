import { KanbanStatus, type Issue } from "../types";
import TodoCard from "./TodoCard";
import InProgressCard from "./InProgressCard";
import InReviewCard from "./InReviewCard";
import DoneCard from "./DoneCard";

/** Picks the card component for an issue based on its column. */
export default function CardRenderer({ issue }: { issue: Issue }) {
    switch (issue.status) {
        case KanbanStatus.Todo:
            return <TodoCard issue={issue} />;
        case KanbanStatus.InProgress:
            return <InProgressCard issue={issue} />;
        case KanbanStatus.InReview:
            return <InReviewCard issue={issue} />;
        case KanbanStatus.Done:
            return <DoneCard issue={issue} />;
    }
}
