import type { Issue } from "@/types/kanban";

import AgentChip from "./AgentChip";
import BaseCard from "./BaseCard";

/** Queued: claimed by an agent, waiting for a runner to free up. */
export default function QueuedCard({ issue }: { issue: Issue }) {
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
