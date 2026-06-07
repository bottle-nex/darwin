"use client";
import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { COLUMNS } from "./data";
import type { FilterValue } from "./useKanbanOptions";
import type { KanbanBoardApi } from "./useKanbanBoard";
import KanbanColumn from "./KanbanColumn";
import CardRenderer from "./cards/CardRenderer";

type KanbanBoardViewProps = KanbanBoardApi & { filter: FilterValue };

/**
 * Board view: the drag-and-drop column grid. When the filter focuses a single
 * status, that column expands full-width and its cards flow into a grid;
 * otherwise all columns show as stacked lists. The dragged card renders in a
 * portal `DragOverlay` so it floats above the columns and follows the cursor.
 */
export default function KanbanBoardView({
    board,
    activeIssue,
    sensors,
    onDragStart,
    onDragOver,
    onDragEnd,
    filter,
}: KanbanBoardViewProps) {
    const focused = filter !== "default";
    const columns = focused ? COLUMNS.filter((c) => c.status === filter) : COLUMNS;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div
                className={cn(
                    "flex min-h-0 flex-1 gap-4 px-3 pt-3 pb-3",
                    focused ? "overflow-hidden" : "overflow-x-auto",
                )}
            >
                {columns.map((column) => (
                    <KanbanColumn
                        key={column.status}
                        column={column}
                        issues={board[column.status]}
                        layout={focused ? "grid" : "list"}
                        fullWidth={focused}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={null}>
                {activeIssue ? (
                    <div className="w-72 rotate-2 cursor-grabbing shadow-2xl">
                        <CardRenderer issue={activeIssue} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
