import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import { type Issue, KanbanStatus } from "@/types/kanban";

import BaseCard from "./BaseCard";

/** Done: the PR merged — the issue is resolved. */
export default function DoneCard({ issue }: { issue: Issue }) {
    const { icon: DoneIcon, titleBox } = KanbanBoard.glyphFor(KanbanStatus.Done);

    return (
        <BaseCard issue={issue} className="opacity-80">
            <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <span className={cn("inline-flex items-center gap-1.5 font-medium", titleBox)}>
                    <DoneIcon className="size-3" aria-hidden />
                    Merged
                </span>
                <span className="text-neutral-500">
                    {[issue.duration, issue.resolvedAt].filter(Boolean).join(" · ")}
                </span>
            </div>
        </BaseCard>
    );
}
