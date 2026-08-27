import { PullRequestOpenIcon } from "@trymatcha/ui/icons";

import type { Issue } from "@/types/kanban";

import AgentChip from "./AgentChip";
import BaseCard from "./BaseCard";

/** In Review: the agent opened a PR back to the repo, awaiting human review. */
export default function InReviewCard({ issue }: { issue: Issue }) {
    return (
        <BaseCard issue={issue}>
            <div className="mt-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-300">
                        <PullRequestOpenIcon className="size-3" aria-hidden />
                        {issue.pr?.number}
                    </span>
                    {issue.pr && (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
                            <span className="text-emerald-400">+{issue.pr.added}</span>
                            <span className="text-rose-400">-{issue.pr.removed}</span>
                        </span>
                    )}
                </div>
                {issue.agent && (
                    <div className="flex justify-end">
                        <AgentChip name={issue.agent} />
                    </div>
                )}
            </div>
        </BaseCard>
    );
}
