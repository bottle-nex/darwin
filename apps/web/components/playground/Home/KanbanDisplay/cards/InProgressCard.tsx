import { ProcessingSpinnerIcon, RunnerIcon } from "@trydarwin/ui/icons";

import type { Issue } from "@/types/kanban";

import AgentChip from "./AgentChip";
import BaseCard from "./BaseCard";

/** In Progress: an agent is actively working the issue on a runner. */
export default function InProgressCard({ issue }: { issue: Issue }) {
    return (
        <BaseCard issue={issue}>
            <div className="mt-2.5 flex flex-col gap-1.5">
                {issue.step && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-300/90">
                        <ProcessingSpinnerIcon className="size-3 animate-spin" aria-hidden />
                        {issue.step}
                    </span>
                )}
                <div className="flex items-center justify-between">
                    {issue.runner && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                            <RunnerIcon className="size-3" aria-hidden />
                            {issue.runner}
                        </span>
                    )}
                    {issue.agent && <AgentChip name={issue.agent} />}
                </div>
            </div>
        </BaseCard>
    );
}
