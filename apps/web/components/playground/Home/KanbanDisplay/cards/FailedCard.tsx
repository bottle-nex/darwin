import { RunFailedIcon } from "@trydarwin/ui/icons";

import type { Issue } from "@/types/kanban";

import AgentChip from "./AgentChip";
import BaseCard from "./BaseCard";

/** Failed: the agent's run errored out before it could open a PR. */
export default function FailedCard({ issue }: { issue: Issue }) {
    return (
        <BaseCard issue={issue}>
            <div className="mt-2.5 flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-300/90">
                    <RunFailedIcon className="size-3 shrink-0" aria-hidden />
                    {issue.error ?? "Run failed"}
                </span>
                {issue.agent && (
                    <div className="flex justify-end">
                        <AgentChip name={issue.agent} />
                    </div>
                )}
            </div>
        </BaseCard>
    );
}
