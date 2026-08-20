"use client";
import { useState } from "react";
import { MdMoreHoriz, MdDelete, MdPeople } from "react-icons/md";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useIssueRoute } from "@/components/playground/Issue/useIssueRoute";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useCustomCardActions } from "@/hooks/kanban/useCustomCardActions";
import { CARD_SHELL } from "../cardStyles";
import IssueCardFace, { issueIdentifier } from "../cards/IssueCardFace";
import IssueDropdown from "../IssueDropdown";
import AssigneePicker from "./AssigneePicker";
import type { CustomCard } from "@/types/kanban-custom";

type CustomKanbanCardProps = {
    card: CustomCard;
    preview?: boolean;
};

export default function CustomKanbanCard({ card, preview = false }: CustomKanbanCardProps) {
    const project = useActiveProject();
    const projectId = project?.id;
    const { removeCard, assignMember, unassignMember, pendingAssigneeId } = useCustomCardActions(
        card.id,
    );
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const canAssign = Boolean(projectId) && !preview;
    const { openIssue } = useIssueRoute();

    const face = (
        <div className={cn(CARD_SHELL, "group/card relative")}>
            {!preview && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label="Card options"
                            onPointerDown={(e) => e.stopPropagation()}
                            className="absolute top-1.5 right-1.5 flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-neutral-200 focus-visible:opacity-100 group-hover/card:opacity-100 data-[state=open]:opacity-100"
                        >
                            <MdMoreHoriz className="size-4" aria-hidden />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        {canAssign && (
                            <DropdownMenuItem onSelect={() => setAssignOpen(true)}>
                                <MdPeople className="size-3.5" aria-hidden />
                                <span className="flex-1">Assignees</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onSelect={() => setConfirmOpen(true)}
                            variant="destructive"
                        >
                            <MdDelete className="size-3.5" aria-hidden />
                            <span className="flex-1">Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
                <IssueCardFace
                    identifier={issueIdentifier(project?.name, card.number ?? "")}
                    issueId={preview ? undefined : card.id}
                    title={card.title}
                    status={card.status}
                    priority={card.priority}
                    tags={card.tags}
                    targetDate={card.targetDate}
                    createdAt={card.createdAt}
                    assignees={card.assignees}
                    onAssigneesClick={canAssign ? () => setAssignOpen(true) : undefined}
                />
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
                                removeCard();
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {canAssign && projectId && (
                <AssigneePicker
                    open={assignOpen}
                    onOpenChange={setAssignOpen}
                    projectId={projectId}
                    assignees={card.assignees}
                    onAssign={assignMember}
                    onUnassign={unassignMember}
                    pendingAssigneeId={pendingAssigneeId}
                />
            )}
        </div>
    );

    if (preview) return face;
    return <IssueDropdown issueId={card.id}>{face}</IssueDropdown>;
}
