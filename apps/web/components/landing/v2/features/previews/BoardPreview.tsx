import { cn } from "@/lib/utils";
import { COLUMNS, INITIAL_BOARD } from "@/components/playground/Home/panes/kanban/data";
import CardRenderer from "@/components/playground/Home/panes/kanban/cards/CardRenderer";
import { KanbanStatus } from "@/components/playground/Home/panes/kanban/types";

export default function BoardPreview() {
    const inProgress = INITIAL_BOARD[KanbanStatus.InProgress][0];
    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-1.5">
                {COLUMNS.slice(0, 3).map((column) => {
                    const { icon: Icon, title, titleBox, status } = column;
                    return (
                        <span
                            key={status}
                            className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                titleBox,
                            )}
                        >
                            <Icon className="size-2.5" aria-hidden />
                            {title}
                        </span>
                    );
                })}
            </div>
            {/* The in-progress card lights up while the agent works it. */}
            <div className="rounded-lg transition-all duration-300 motion-reduce:transition-none">
                <CardRenderer issue={inProgress} />
            </div>
        </div>
    );
}
