import type { Issue } from "@/types/kanban";

import AgentChip from "./AgentChip";
import BaseCard from "./BaseCard";

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
