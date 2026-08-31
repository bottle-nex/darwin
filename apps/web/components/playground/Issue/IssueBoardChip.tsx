"use client";
import { SpaceEntityIcon } from "@trymatcha/ui/icons";

import { IconPickGlyph } from "@/components/ui/IconPicker";
import { useBoardColumns } from "@/hooks/issues/useBoardColumns";
import { useActiveProject } from "@/hooks/useActiveProject";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import type { BoardIssue } from "@/types/board";

import IssueFieldChip from "./IssueFieldChip";

/**
 * Where an issue lives, as one glyph you can act on.
 *
 * On the agent board that place is its status, so it draws the status icon and
 * tapping it changes status. Parked in a space, the status is meaningless — the
 * lanes there are the space's own columns — so it draws that space's icon and
 * tapping it moves the issue between boards instead.
 */
export default function IssueBoardChip({
    issueId,
    issue,
    status,
    contentClassName,
}: {
    issueId: string;
    issue?: BoardIssue;
    status: string | undefined;
    contentClassName?: string;
}) {
    const projectId = useActiveProject()?.id;
    const { data: metadata } = useBoardColumns(projectId);

    const columnId = issue?.customColumnId ?? null;
    const spaceId = columnId
        ? metadata?.columns.find((column) => column.id === columnId)?.spaceId
        : undefined;
    const space = spaceId ? metadata?.spaces.find((row) => row.id === spaceId) : undefined;

    if (columnId) {
        return (
            <IssueFieldChip
                issueId={issueId}
                issue={issue}
                field="move"
                contentClassName={contentClassName}
            >
                {space?.icon ? (
                    <IconPickGlyph pick={space.icon} className="size-4 shrink-0 text-base" />
                ) : (
                    <SpaceEntityIcon className="size-4 shrink-0 text-neutral-400" aria-hidden />
                )}
            </IssueFieldChip>
        );
    }

    const glyph = KanbanBoard.glyphFor(status);
    const StatusIcon = glyph.icon;

    return (
        <IssueFieldChip
            issueId={issueId}
            issue={issue}
            field="status"
            contentClassName={contentClassName}
        >
            <StatusIcon className={cn("size-4 shrink-0", glyph.titleBox)} aria-hidden />
        </IssueFieldChip>
    );
}
