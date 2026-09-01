import { displayNameOf, toneFor } from "@/components/playground/Core/components/PlaygroundAvatar";
import type { BoardAssignee, BoardIssue } from "@/types/board";
import type { Assignee, Issue, KanbanStatus, Priority } from "@/types/kanban";

/** Maps the real API's board payload onto the LLM Kanban's display shapes. */
export class KanbanMappers {
    static readonly NUMBER_TO_PRIORITY: Record<number, Priority> = {
        0: "none",
        1: "urgent",
        2: "high",
        3: "medium",
        4: "low",
    };

    static toAssignee(a: BoardAssignee): Assignee {
        return {
            id: a.id,
            name: displayNameOf(a.name, a.email),
            image: a.image,
            tone: toneFor(a.id),
        };
    }

    /** One issue as a card. Parked issues keep their own status, which draws the off-board glyph. */
    static toIssue(issue: BoardIssue, projectName: string): Issue {
        return {
            id: issue.id,
            boardIssue: issue,
            number: String(issue.number),
            title: issue.title,
            project: projectName,
            tags: issue.tags,
            priority: KanbanMappers.NUMBER_TO_PRIORITY[issue.priority] ?? "medium",
            assignees: issue.assignees.map(KanbanMappers.toAssignee),
            comments: 0,
            status: issue.status as KanbanStatus,
            createdAt: issue.createdAt,
            targetDate: issue.targetDate,
            pr: issue.prNumber === null ? undefined : { number: `#${issue.prNumber}` },
        };
    }
}
