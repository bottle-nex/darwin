"use client";
import { cn } from "@/lib/utils";
import { useBoard } from "@/hooks/issues/useBoard";
import { useParams } from "next/navigation";
import { useOpenIssue } from "./useOpenIssue";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { getLabel, PRIORITY_DOT } from "@/components/playground/Home/KanbanDisplay/data";
import { NUMBER_TO_PRIORITY, toAssignee } from "@/components/playground/Home/KanbanDisplay/mappers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BoardIssue } from "@/types/board";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import LLMIssueStatusTicker from "@/components/playground/Home/KanbanDisplay/LLMIssueStatusTicker";

export default function IssueDialog() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { openIssueId, closeIssue } = useOpenIssue();

    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = dashboard?.projects.find((p) => p.slug === projectSlug);
    const { data: board } = useBoard(activeProject?.id);

    const issue = openIssueId ? board?.issues.find((i) => i.id === openIssueId) : undefined;

    return (
        <Dialog open={Boolean(openIssueId)} onOpenChange={(open) => !open && closeIssue()}>
            <DialogContent className="dark border-neutral-800 bg-charcoal text-neutral-100 sm:max-w-lg">
                {issue ? <IssueDetail issue={issue} /> : <IssueMissing />}
            </DialogContent>
        </Dialog>
    );
}

function IssueDetail({ issue }: { issue: BoardIssue }) {
    const priority = NUMBER_TO_PRIORITY[issue.priority] ?? "normal";
    const label = issue.label ? getLabel(issue.label) : undefined;
    const assignees = issue.assignees.map(toAssignee);

    return (
        <>
            <DialogHeader>
                <div className="flex items-center gap-2">
                    <span
                        className={cn("size-1.5 rounded-full", PRIORITY_DOT[priority])}
                        aria-hidden
                    />
                    <span className="font-mono text-[11px] text-neutral-500">#{issue.number}</span>
                    {label && (
                        <span
                            className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                                label.className,
                            )}
                        >
                            {label.name}
                        </span>
                    )}
                    <LLMIssueStatusTicker
                        status={issue.status}
                        size="sm"
                        showIcon={false}
                        className="ml-auto"
                    />
                </div>
                <DialogTitle className="mt-1 text-left text-base text-neutral-100">
                    {issue.title}
                </DialogTitle>
            </DialogHeader>

            {issue.description ? (
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-neutral-300">
                    {issue.description}
                </p>
            ) : (
                <p className="text-[13px] text-neutral-600 italic">No description.</p>
            )}

            {assignees.length > 0 && (
                <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                    <span className="text-[12px] font-medium text-neutral-400">Assignees</span>
                    <div className="flex items-center -space-x-1">
                        {assignees.map((a) => (
                            <PlaygroundAvatar
                                key={a.id}
                                letter={a.name.charAt(0).toUpperCase()}
                                tone={a.tone}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

function IssueMissing() {
    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-left text-base text-neutral-100">Issue</DialogTitle>
            </DialogHeader>
            <p className="text-[13px] text-neutral-500">Loading this issue…</p>
        </>
    );
}
