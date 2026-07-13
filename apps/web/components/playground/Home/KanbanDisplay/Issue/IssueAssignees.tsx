import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import type { BoardIssue } from "@/types/board";

/** Overlapping avatar stack of an issue's assignees. */
export default function IssueAssignees({ issue }: { issue: BoardIssue }) {
    if (!issue.assignees.length) return null;
    return (
        <div className="flex items-center -space-x-1">
            {issue.assignees.map(KanbanMappers.toAssignee).map((a) => (
                <PlaygroundAvatar
                    key={a.id}
                    letter={a.name.charAt(0).toUpperCase()}
                    src={a.image}
                    tone={a.tone}
                />
            ))}
        </div>
    );
}
