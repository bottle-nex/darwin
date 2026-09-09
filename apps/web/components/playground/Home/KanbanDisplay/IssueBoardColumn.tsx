"use client";
import { useDroppable } from "@dnd-kit/core";
import {
    AddIcon,
    BulkSelectIcon,
    CloseIcon,
    DeleteIcon,
    EditIcon,
    OverflowMenuIcon,
} from "@trydarwin/ui/icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { FacetIssueGroup } from "@/hooks/issues/useIssueGroups";
import { groupDropId } from "@/hooks/kanban/useIssueDragHandlers";
import { useActiveProject } from "@/hooks/useActiveProject";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { cn } from "@/lib/utils";
import type { IssueSelectionScope } from "@/store/issues/useIssueSelectionStore";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";
import type { BoardIssue } from "@/types/board";

import DraggableIssueCard from "./DraggableIssueCard";
import FacetOptionGlyph from "./OptionsBar/KanbanOptionPanels/FacetOptionGlyph";
import VirtualizedIssueCards from "./VirtualizedIssueCards";
import type { AutoFillOptions } from "./virtualizedRows.type";

/** What a space's own columns can do beyond holding issues. */
export type ColumnActions = {
    onRename: (label: string) => void;
    onDelete: () => void;
    onMove: (direction: -1 | 1) => void;
    canMoveLeft: boolean;
    canMoveRight: boolean;
};

export type IssueBoardColumnProps = {
    group: FacetIssueGroup;
    selectionScope: IssueSelectionScope;
    droppable: boolean;
    canDragCard: (issue: BoardIssue) => boolean;
    columnActions?: ColumnActions;
    onCreate?: () => void;
    /** A focused column takes the whole pane instead of its fixed board width. */
    fullWidth?: boolean;
    knownTotal?: number;
    autoFill?: AutoFillOptions;
};

export default function IssueBoardColumn({
    group,
    selectionScope,
    droppable,
    canDragCard,
    columnActions,
    onCreate,
    fullWidth = false,
    knownTotal,
    autoFill,
}: IssueBoardColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: groupDropId(group.key),
        disabled: !droppable,
    });
    const project = useActiveProject();
    const selectedIds = useIssueSelectionStore((s) => s.ids);
    const replaceSelection = useIssueSelectionStore((s) => s.replace);
    const clearSelection = useIssueSelectionStore((s) => s.clear);
    const [draftTitle, setDraftTitle] = useState<string | null>(null);
    const title = group.title || "No group";

    function commitRename() {
        const next = draftTitle?.trim();
        if (next && next !== group.title) columnActions?.onRename(next);
        setDraftTitle(null);
    }

    return (
        <div
            data-column-group={group.key}
            className={cn(
                "surface-sunken group flex max-h-full min-h-0 flex-col rounded-lg p-2 transition-colors",
                fullWidth ? "min-w-0 flex-1" : "w-84 shrink-0",
                isOver && "ring-2 ring-primary/40",
            )}
        >
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                {draftTitle === null ? (
                    <div className="flex min-w-0 items-center gap-2">
                        <FacetOptionGlyph option={group.option} />
                        <span className="truncate text-[13px] font-semibold text-neutral-200">
                            {title}
                        </span>
                        <span className="shrink-0 text-[11px] font-medium text-neutral-500 tabular-nums">
                            {group.issues.length}
                        </span>
                    </div>
                ) : (
                    <Input
                        autoFocus
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                commitRename();
                            } else if (event.key === "Escape") {
                                setDraftTitle(null);
                            }
                        }}
                        className="h-7 rounded-sm text-[12px] shadow-none!"
                    />
                )}
                <div className="flex items-center gap-1">
                    {onCreate && (
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={onCreate}
                            aria-label={`Add an issue to ${title}`}
                            className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-overlay/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100"
                        >
                            <AddIcon className="size-4" aria-hidden />
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="unstyled"
                                type="button"
                                aria-label={`${title} options`}
                                className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-overlay/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                            >
                                <OverflowMenuIcon className="size-4" aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                                disabled={group.issues.length === 0}
                                onSelect={() =>
                                    replaceSelection(
                                        selectionScope,
                                        group.issues.map((issue) => issue.id),
                                    )
                                }
                            >
                                <BulkSelectIcon className="size-3.5" aria-hidden />
                                <span className="flex-1">Select loaded issues</span>
                                <span className="text-[11px] text-neutral-500">
                                    {group.issues.length}
                                </span>
                            </DropdownMenuItem>

                            {selectedIds.length > 0 && (
                                <DropdownMenuItem onSelect={clearSelection}>
                                    <CloseIcon className="size-3.5" aria-hidden />
                                    <span className="flex-1">Clear selection</span>
                                </DropdownMenuItem>
                            )}

                            {columnActions && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => setDraftTitle(group.title)}>
                                        <EditIcon className="size-3.5" aria-hidden />
                                        <span className="flex-1">Rename list</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        disabled={!columnActions.canMoveLeft}
                                        onSelect={() => columnActions.onMove(-1)}
                                    >
                                        <span className="flex-1">Move left</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        disabled={!columnActions.canMoveRight}
                                        onSelect={() => columnActions.onMove(1)}
                                    >
                                        <span className="flex-1">Move right</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={columnActions.onDelete}
                                    >
                                        <DeleteIcon className="size-3.5" aria-hidden />
                                        <span className="flex-1">Delete list</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <VirtualizedIssueCards
                items={group.issues}
                knownTotal={knownTotal}
                autoFill={autoFill}
                estimateSize={156}
                className="min-h-0 flex-1 rounded-lg p-0.5 no-scrollbar"
                scrollElementRef={setNodeRef}
                dataColumnList={group.key}
                renderItem={(issue) => (
                    <DraggableIssueCard
                        issue={KanbanMappers.toIssue(issue, project?.name ?? "")}
                        selectionScope={selectionScope}
                        draggable={canDragCard(issue)}
                    />
                )}
                status={{
                    label:
                        group.issues.length === 0
                            ? `No issues in ${title}`
                            : `${group.issues.length} loaded issues in ${title}`,
                }}
                footer={
                    onCreate ? (
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={onCreate}
                            className="mt-2 flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[9px] bg-overlay/5 px-2 py-1.5 text-center text-[13px] font-medium text-neutral-400 transition-colors hover:bg-overlay/8 hover:text-neutral-200"
                        >
                            <AddIcon className="size-3.5" aria-hidden />
                            Add an Issue
                        </Button>
                    ) : undefined
                }
            />
        </div>
    );
}
