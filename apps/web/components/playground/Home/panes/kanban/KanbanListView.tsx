"use client";
import { MdChat } from "react-icons/md";
import { cn } from "@/lib/utils";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { COLUMNS, PRIORITY_DOT } from "./data";
import type { BoardState, Issue } from "./types";
import AgentChip from "./cards/AgentChip";
import LLMIssueStatusTicker from "./LLMIssueStatusTicker";

type KanbanListViewProps = {
    board: BoardState;
};

export default function KanbanListView({ board }: KanbanListViewProps) {
    const groups = COLUMNS;

    return (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <div className="flex flex-col gap-5">
                {groups.map((column) => {
                    const issues = board[column.status];
                    return (
                        <section key={column.status}>
                            <LLMIssueStatusTicker
                                status={column.status}
                                count={issues.length}
                                className="mb-1.5"
                            />

                            <div className="overflow-hidden rounded-lg ring-1 ring-white/5">
                                {issues.length === 0 ? (
                                    <p className="px-3 py-3 text-[12px] text-neutral-600">
                                        No issues
                                    </p>
                                ) : (
                                    issues.map((issue) => <ListRow key={issue.id} issue={issue} />)
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

function ListRow({ issue }: { issue: Issue }) {
    return (
        <div className="flex items-center gap-3 border-b border-white/5 bg-neutral-800/40 px-3 py-2 last:border-b-0 hover:bg-neutral-800/70">
            <span
                className={cn("size-1.5 shrink-0 rounded-full", PRIORITY_DOT[issue.priority])}
                aria-hidden
            />
            <span className="truncate text-[13px] font-medium text-neutral-100">{issue.title}</span>
            <span className="shrink-0 font-mono text-[11px] text-neutral-500">{issue.number}</span>
            {issue.label && (
                <span
                    className={cn(
                        "hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline",
                        issue.label.className,
                    )}
                >
                    {issue.label.name}
                </span>
            )}

            <span className="ml-auto hidden shrink-0 items-center gap-1 text-[11px] text-neutral-500 sm:flex">
                <MdChat className="size-3" aria-hidden />
                {issue.comments}
            </span>
            <span className="hidden shrink-0 truncate text-[11px] text-neutral-600 md:block">
                {issue.project}
            </span>
            {issue.agent && (
                <span className="hidden shrink-0 lg:block">
                    <AgentChip name={issue.agent} />
                </span>
            )}
            <div className="flex shrink-0 items-center -space-x-1">
                {issue.assignees.map((a) => (
                    <PlaygroundAvatar
                        key={a.id}
                        letter={a.name.charAt(0).toUpperCase()}
                        tone={a.tone}
                        size="sm"
                        className="ring-1 ring-neutral-800"
                    />
                ))}
            </div>
        </div>
    );
}
