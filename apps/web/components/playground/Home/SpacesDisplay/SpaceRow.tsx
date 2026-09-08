"use client";
import { DeleteIcon, EditIcon, OverflowMenuIcon, SpaceEntityIcon } from "@trydarwin/ui/icons";

import SelectableRow from "@/components/playground/Core/components/SelectableRow";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import { useSpaceSelection } from "@/hooks/spaces/useSpaceSelection";
import { cn } from "@/lib/utils";
import type { BoardSpace } from "@/types/board";

import { SPACE_CELL } from "./spaceCells";
import SpaceDates from "./SpaceDates";
import SpaceProgressRing from "./SpaceProgressRing";

export type SpaceRowProps = {
    space: BoardSpace;
    issueCount: number;
    doneCount: number;
    canManage: boolean;
    selected: boolean;
    selectionActive: boolean;
    joinedAbove: boolean;
    joinedBelow: boolean;
    onToggleSelection: () => void;
    onOpen: () => void;
    onEdit: () => void;
    onDelete: () => void;
};

export default function SpaceRow({
    space,
    issueCount,
    doneCount,
    canManage,
    selected,
    selectionActive,
    joinedAbove,
    joinedBelow,
    onToggleSelection,
    onOpen,
    onEdit,
    onDelete,
}: SpaceRowProps) {
    const { handleSelectClick } = useSpaceSelection();
    const ratio = issueCount ? doneCount / issueCount : 0;

    return (
        <SelectableRow
            data-space-id={space.id}
            data-selected={selected}
            selected={selected}
            selectionActive={selectionActive}
            joinedAbove={joinedAbove}
            joinedBelow={joinedBelow}
            selectionLabel={selected ? `Deselect ${space.name}` : `Select ${space.name}`}
            onToggleSelection={onToggleSelection}
            className="min-h-11 w-full px-3 text-left"
        >
            <Button
                variant="unstyled"
                type="button"
                onClick={(event) => {
                    if (handleSelectClick(event, space.id)) return;
                    onOpen();
                }}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
            >
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    {space.icon ? (
                        <IconPickGlyph pick={space.icon} className="size-4 shrink-0 text-base" />
                    ) : (
                        <SpaceEntityIcon className="size-4 shrink-0 text-neutral-400" aria-hidden />
                    )}
                    <span className="truncate text-[13px] font-medium text-neutral-100">
                        {space.name}
                    </span>
                </span>

                <span
                    className={cn(SPACE_CELL.description, "truncate text-[12px] text-neutral-500")}
                >
                    {space.description ?? ""}
                </span>
            </Button>

            <div className={cn(SPACE_CELL.target, "items-center")}>
                <SpaceDates space={space} canManage={canManage} />
            </div>

            <span className={cn(SPACE_CELL.issues, "text-[12px] text-neutral-400")}>
                {issueCount}
            </span>

            <span
                className={cn(
                    SPACE_CELL.progress,
                    "flex items-center justify-end gap-1.5 text-[12px] text-neutral-400",
                )}
            >
                <SpaceProgressRing ratio={ratio} />
                {Math.round(ratio * 100)}%
            </span>

            <div className={cn(SPACE_CELL.actions, "flex items-center justify-end")}>
                {canManage && (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="unstyled"
                                type="button"
                                aria-label={`${space.name} actions`}
                                className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 ring-inset transition-opacity hover:bg-white/5 hover:text-neutral-200 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-hidden group-hover/selectable:opacity-100 data-[state=open]:opacity-100"
                            >
                                <OverflowMenuIcon className="size-4" aria-hidden />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onSelect={onEdit}>
                                <EditIcon className="size-3.5" aria-hidden />
                                <span className="flex-1">Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                                <DeleteIcon className="size-3.5" aria-hidden />
                                <span className="flex-1">Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </SelectableRow>
    );
}
