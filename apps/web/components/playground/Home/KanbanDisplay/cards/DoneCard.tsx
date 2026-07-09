import { MdCheckCircle } from "react-icons/md";
import type { Issue } from "../types";
import BaseCard from "./BaseCard";

/** Done: the PR merged — the issue is resolved. */
export default function DoneCard({ issue }: { issue: Issue }) {
    return (
        <BaseCard issue={issue} className="opacity-80">
            <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400/90">
                    <MdCheckCircle className="size-3" aria-hidden />
                    Merged
                </span>
                <span className="text-neutral-500">
                    {[issue.duration, issue.resolvedAt].filter(Boolean).join(" · ")}
                </span>
            </div>
        </BaseCard>
    );
}
