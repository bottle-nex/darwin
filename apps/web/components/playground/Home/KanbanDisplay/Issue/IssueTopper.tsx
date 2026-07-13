import type { IssueTarget } from "@/store/issues/useCreateOrEditIssueStore";
import type { BoardIssue } from "@/types/board";
import { TaskTargetBadge } from "../taskTheme";
import LLMIssueStatusTicker from "../LLMIssueStatusTicker";

/** Header row: which board the issue lives on, plus its number and agent status. */
export default function IssueTopper({
    target,
    issue,
    action,
}: {
    target: IssueTarget;
    issue: BoardIssue | null;
    action?: React.ReactNode;
}) {
    return (
        <section className="flex items-center justify-between w-full">
            <div className="flex w-full items-center gap-2">
                <TaskTargetBadge
                    kind={target.board}
                    columnTitle={target.board === "custom" ? target.columnTitle : undefined}
                />
                {issue && (
                    <div className="ml-auto flex items-center gap-2">
                        <span className="font-mono text-[11px] text-neutral-500">
                            #{issue.number}
                        </span>
                        <LLMIssueStatusTicker status={issue.status} size="sm" showIcon={false} />
                    </div>
                )}
            </div>
            {action}
        </section>
    );
}
