"use client";
import { MdCheck } from "react-icons/md";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import type { BoardAssignee } from "@/types/board";

type AssigneePickerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    assignees: BoardAssignee[];
    onAssign: (userId: string) => void;
    onUnassign: (userId: string) => void;
};

/**
 * A dialog listing the project's members; clicking a row toggles whether that
 * person is assigned to the issue (assign / unassign). The assigned rows are
 * highlighted with a check. Mutations fire immediately; the board refetch keeps
 * the card's avatars in sync.
 */
export default function AssigneePicker({
    open,
    onOpenChange,
    projectId,
    assignees,
    onAssign,
    onUnassign,
}: AssigneePickerProps) {
    const { data: members, isLoading } = useProjectMembers(projectId);
    const assignedIds = new Set(assignees.map((a) => a.id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-white/10 bg-charcoal sm:max-w-100">
                <DialogHeader>
                    <DialogTitle className="text-neutral-100">Assignees</DialogTitle>
                    <DialogDescription className="text-neutral-500">
                        Pick who works on this issue.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                    {isLoading ? (
                        <p className="px-1 py-2 text-[12px] text-neutral-500">Loading members…</p>
                    ) : !members?.length ? (
                        <p className="px-1 py-2 text-[12px] text-neutral-500">No members yet.</p>
                    ) : (
                        members.map((member) => {
                            const assigned = assignedIds.has(member.id);
                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() =>
                                        assigned ? onUnassign(member.id) : onAssign(member.id)
                                    }
                                    className={cn(
                                        "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                                        assigned ? "bg-white/8" : "hover:bg-white/5",
                                    )}
                                >
                                    <span className="flex min-w-0 flex-col">
                                        <span className="truncate text-[13px] font-medium text-neutral-100">
                                            {member.name ?? member.email}
                                        </span>
                                        <span className="truncate text-[11px] text-neutral-500">
                                            {member.email}
                                        </span>
                                    </span>
                                    {assigned && (
                                        <MdCheck
                                            className="size-4 shrink-0 text-emerald-300"
                                            aria-hidden
                                        />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
