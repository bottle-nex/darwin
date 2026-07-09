"use client";
import { useState } from "react";
import { MdMoreHoriz, MdEdit, MdDelete, MdPeople } from "react-icons/md";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useOpenIssue } from "@/components/playground/issue/useOpenIssue";
import { getLabel, PRIORITY_DOT } from "../data";
import { PANEL_CONTENT, PANEL_ITEM } from "../OptionsBar/KanbanOptionPanels/panelStyles";
import CardAvatars from "./CardAvatars";
import AssigneePicker from "./AssigneePicker";
import type { CustomCard } from "./types";

type CustomKanbanCardProps = {
    card: CustomCard;
    onEdit?: () => void;
    onDelete?: () => void;
    projectId?: string;
    onAssign?: (userId: string) => void;
    onUnassign?: (userId: string) => void;
};

export default function CustomKanbanCard({
    card,
    onEdit,
    onDelete,
    projectId,
    onAssign,
    onUnassign,
}: CustomKanbanCardProps) {
    const label = card.label ? getLabel(card.label) : undefined;
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const canAssign = Boolean(projectId && onAssign && onUnassign);
    const { openIssue } = useOpenIssue();

    return (
        <div className="group/card relative rounded-lg bg-white/5 p-2.5 ring-1 ring-white/5 transition-colors hover:ring-white/15">
            {(onEdit || onDelete || canAssign) && (
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button
                            type="button"
                            aria-label="Card options"
                            onPointerDown={(e) => e.stopPropagation()}
                            className="absolute top-1.5 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover/card:opacity-100 data-[state=open]:opacity-100"
                        >
                            <MdMoreHoriz className="size-4" aria-hidden />
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            align="end"
                            sideOffset={6}
                            className={`w-40 ${PANEL_CONTENT}`}
                        >
                            {onEdit && (
                                <DropdownMenu.Item onSelect={onEdit} className={PANEL_ITEM}>
                                    <MdEdit className="size-3.5" aria-hidden />
                                    <span className="flex-1">Edit</span>
                                </DropdownMenu.Item>
                            )}
                            {canAssign && (
                                <DropdownMenu.Item
                                    onSelect={() => setAssignOpen(true)}
                                    className={PANEL_ITEM}
                                >
                                    <MdPeople className="size-3.5" aria-hidden />
                                    <span className="flex-1">Assignees</span>
                                </DropdownMenu.Item>
                            )}
                            {onDelete && (
                                <DropdownMenu.Item
                                    onSelect={() => setConfirmOpen(true)}
                                    className={`${PANEL_ITEM} text-rose-300 data-highlighted:text-rose-200`}
                                >
                                    <MdDelete className="size-3.5" aria-hidden />
                                    <span className="flex-1">Delete</span>
                                </DropdownMenu.Item>
                            )}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            )}

            <div
                role="button"
                tabIndex={0}
                className="cursor-pointer"
                onClick={() => openIssue(card.id)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openIssue(card.id);
                    }
                }}
            >
                <div className="flex items-start gap-2 pr-5">
                    <span
                        className={cn(
                            "mt-1.5 size-1.5 shrink-0 rounded-full",
                            PRIORITY_DOT[card.priority],
                        )}
                        aria-hidden
                    />
                    <p className="text-[13px] leading-snug font-medium text-neutral-100">
                        {card.title}
                    </p>
                </div>

                {card.description && (
                    <p className="mt-1.5 line-clamp-2 pl-3.5 text-[12px] leading-snug text-neutral-400">
                        {card.description}
                    </p>
                )}

                {label && (
                    <div className="mt-2 pl-3.5">
                        <span
                            className={cn(
                                "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
                                label.className,
                            )}
                        >
                            {label.name}
                        </span>
                    </div>
                )}

                <div className="mt-2 flex items-center justify-between gap-2 pl-3.5">
                    <span className="text-[11px] font-medium text-neutral-500">
                        {card.number ? `#${card.number}` : ""}
                    </span>
                    <CardAvatars assignees={card.assignees} />
                </div>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="border-white/10 bg-charcoal sm:max-w-100">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-100">Delete issue</DialogTitle>
                        <DialogDescription className="text-neutral-500">
                            This permanently deletes “{card.title}”. You can&apos;t undo this.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="tertiary"
                            onClick={() => setConfirmOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                setConfirmOpen(false);
                                onDelete?.();
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {canAssign && projectId && onAssign && onUnassign && (
                <AssigneePicker
                    open={assignOpen}
                    onOpenChange={setAssignOpen}
                    projectId={projectId}
                    assignees={card.assignees}
                    onAssign={onAssign}
                    onUnassign={onUnassign}
                />
            )}
        </div>
    );
}
