"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { LuInfo } from "react-icons/lu";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { KanbanMappers } from "@/lib/kanban/KanbanMappers";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";
import type { BoardIssue } from "@/types/board";
import type { IssueTarget } from "@/store/issues/useCreateOrEditIssueStore";
import IssueDescriptionEditor from "./editor/IssueDescriptionEditor";
import IssueTags from "../IssueTags";
import IssueShell from "./IssueShell";
import IssueTopper from "./IssueTopper";
import IssueAssignees from "./IssueAssignees";
import { PRIORITY_OPTIONS } from "./issueHelpers";

/** Read-only view for issues the agent has already claimed — cannot be edited while it runs. */
export default function LockedIssue({ target, issue }: { target: IssueTarget; issue: BoardIssue }) {
    const { close } = useIssueDialog();
    const priority = KanbanMappers.NUMBER_TO_PRIORITY[issue.priority] ?? "normal";

    return (
        <IssueShell>
            <div className="flex flex-col items-start gap-y-3 ">
                <IssueTopper target={target} issue={issue} />
                <DialogTitle className="text-left text-3xl font-semibold text-neutral-100">
                    {issue.title}
                </DialogTitle>
                <div className="flex items-center gap-x-2.5">
                    <span className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1 text-xs text-white/55 ring ring-white/10">
                        <span
                            className={cn(
                                "size-2 rounded-full",
                                KanbanBoard.PRIORITY_DOT[priority],
                            )}
                            aria-hidden
                        />
                        {PRIORITY_OPTIONS.find((p) => p.value === priority)?.label}
                    </span>
                    <IssueTags tags={issue.tags} max={6} size="md" />
                    <IssueAssignees issue={issue} />
                </div>
            </div>
            <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto ">
                <IssueDescriptionEditor editable={false} initialContent={issue.description} />
            </div>
            <div className="h-fit flex items-center justify-between">
                <div className="flex items-center justify-center gap-x-1 text-xs text-white/70">
                    <LuInfo size={10} />
                    <span>
                        The agent has picked this issue up. It can&apos;t be edited while it runs.
                    </span>
                </div>
                <Button variant={"tertiary"} onClick={close}>
                    Close
                </Button>
            </div>
        </IssueShell>
    );
}
