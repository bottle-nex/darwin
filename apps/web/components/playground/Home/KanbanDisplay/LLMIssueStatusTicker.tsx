import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import type { ServerIssueStatus } from "@/types/board";
import type { KanbanStatus } from "@/types/kanban";

const SIZES = {
    md: { box: "gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium", icon: "size-4" },
    sm: { box: "gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium", icon: "size-3" },
} as const;

interface LLMIssueStatusTickerProps {
    status: KanbanStatus | ServerIssueStatus;
    size?: keyof typeof SIZES;
    count?: number;
    showIcon?: boolean;
    showLabel?: boolean;
    className?: string;
}

export default function LLMIssueStatusTicker({
    status,
    size = "md",
    count,
    showIcon = true,
    showLabel = true,
    className,
}: LLMIssueStatusTickerProps) {
    const column = KanbanBoard.COLUMNS.find((c) => c.status === (status as string));
    if (!column) return null;

    const { icon: Icon, title, titleBox } = column;
    const styles = SIZES[size];

    return (
        <span className={cn("inline-flex items-center", styles.box, titleBox, className)}>
            {showIcon && <Icon className={styles.icon} aria-hidden />}
            {showLabel && <span>{title}</span>}
            {count !== undefined && <span className="text-[11px] font-medium">{count}</span>}
        </span>
    );
}
