"use client";
import { useState } from "react";
import { MdMoreHoriz, MdDelete, MdPeople } from "react-icons/md";
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
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";
import { PRIORITY_DOT } from "../data";
import { CARD_SHELL } from "../cardStyles";
import { PANEL_CONTENT, PANEL_ITEM } from "../OptionsBar/KanbanOptionPanels/panelStyles";
import IssueTags from "../IssueTags";
import AssigneePicker from "./AssigneePicker";
import { stripHtml } from "./mappers";
import type { CustomCard } from "./types";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";

/** Cards are narrow; anything past this collapses into a `+N`. */
const MAX_AVATARS = 3;

type CustomKanbanCardProps = {
    card: CustomCard;
    onDelete?: () => void;
    projectId?: string;
    onAssign?: (userId: string) => void;
    onUnassign?: (userId: string) => void;
};

export default function CustomKanbanCard({
    card,
    onDelete,
    projectId,
    onAssign,
    onUnassign,
}: CustomKanbanCardProps) {
    const preview = card.description ? stripHtml(card.description) : "";
    const shownAssignees = card.assignees.slice(0, MAX_AVATARS);
    const overflowCount = card.assignees.length - shownAssignees.length;
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const canAssign = Boolean(projectId && onAssign && onUnassign);
    const { openEdit } = useIssueDialog();

    return (
        <div className={cn(CARD_SHELL, "group/card relative")}>
            {(onDelete || canAssign) && (
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
                onClick={() => openEdit(card.id)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openEdit(card.id);
                    }
                }}
            >
                <div className="flex items-center justify-between gap-2 pr-6">
                    <div className="flex items-center gap-1.5">
                        <span
                            className={cn("size-1.5 rounded-full", PRIORITY_DOT[card.priority])}
                            aria-hidden
                        />
                        <IssueTags tags={card.tags} />
                    </div>
                    <span className="font-mono text-[11px] text-neutral-500">
                        {card.number ? `#${card.number}` : ""}
                    </span>
                </div>

                <p className="mt-2 text-[13px] leading-snug font-medium text-neutral-100">
                    {card.title}
                </p>

                {preview && (
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-neutral-400">
                        {preview}
                    </p>
                )}

                <div className="mt-3 flex items-center justify-end border-t border-white/5 pt-2.5">
                    <div className="flex shrink-0 items-center -space-x-1">
                        {shownAssignees.map((a, index) => (
                            <PlaygroundAvatar
                                key={a.id}
                                letter={a.name.charAt(0).toUpperCase()}
                                src={a.image}
                                tone={a.tone}
                                className={cn(
                                    index === 0 && shownAssignees.length > 1 && "-rotate-7",
                                )}
                            />
                        ))}
                        {overflowCount > 0 && (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-white/10 text-[11px] font-medium text-neutral-300 ring-1 ring-inset ring-white/15">
                                +{overflowCount}
                            </span>
                        )}
                    </div>
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
