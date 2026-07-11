import { MdSchedule } from "react-icons/md";
import type { Issue } from "@/types/kanban";
import BaseCard from "./BaseCard";
import AgentChip from "./AgentChip";

/** Queued: claimed by an agent, waiting for a runner to free up. */
export default function QueuedCard({ issue }: { issue: Issue }) {
    return (
        <BaseCard issue={issue}>
            <div className="mt-2.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-sky-300/90">
                    <MdSchedule className="size-3" aria-hidden />
                    Waiting for runner
                </span>
                {issue.agent && <AgentChip name={issue.agent} />}
            </div>
        </BaseCard>
    );
}
