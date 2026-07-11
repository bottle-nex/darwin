import { MdAccessTimeFilled } from "react-icons/md";
import type { Issue } from "@/types/kanban";
import BaseCard from "./BaseCard";
import AgentChip from "./AgentChip";

/** To Do: a filed issue waiting in the agent's pickup queue. */
export default function TodoCard({ issue }: { issue: Issue }) {
    return (
        <BaseCard issue={issue}>
            <div className="mt-2.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <MdAccessTimeFilled className="size-3" aria-hidden />
                    {issue.queuePosition ? `In queue · #${issue.queuePosition}` : "In queue"}
                </span>
                {issue.agent && <AgentChip name={issue.agent} />}
            </div>
        </BaseCard>
    );
}
