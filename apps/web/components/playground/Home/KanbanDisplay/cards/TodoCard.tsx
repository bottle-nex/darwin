import type { Issue } from "@/types/kanban";
import BaseCard from "./BaseCard";
import AgentChip from "./AgentChip";

/** To Do: a filed issue waiting in the agent's pickup queue. */
export default function TodoCard({ issue }: { issue: Issue }) {
    return (
        <BaseCard issue={issue}>
            {issue.agent && (
                <div className="mt-2.5 flex items-center justify-end">
                    <AgentChip name={issue.agent} />
                </div>
            )}
        </BaseCard>
    );
}
