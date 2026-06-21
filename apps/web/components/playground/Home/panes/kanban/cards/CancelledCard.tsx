import { MdBlock } from "react-icons/md";
import type { Issue } from "../types";
import BaseCard from "./BaseCard";

/** Cancelled: a human pulled the issue before the agent finished it. */
export default function CancelledCard({ issue }: { issue: Issue }) {
    return (
        <BaseCard issue={issue} className="opacity-70">
            <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-medium text-neutral-400">
                    <MdBlock className="size-3" aria-hidden />
                    Cancelled
                </span>
                {issue.resolvedAt && <span className="text-neutral-500">{issue.resolvedAt}</span>}
            </div>
        </BaseCard>
    );
}
