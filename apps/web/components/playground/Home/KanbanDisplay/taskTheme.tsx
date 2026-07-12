import type { ComponentType } from "react";
import { LuColumns3 } from "react-icons/lu";
import { cn } from "@/lib/utils";
import HeroBuddy from "@/components/landing/v2/HeroBuddy";

const BoardBuddy = ({ className }: { className?: string }) => (
    <HeroBuddy move={false} className={className} />
);

/**
 * Where a freshly created task lands. `llm` joins the agent-driven LLM board as
 * To-Do; `custom` is parked in a user-built column and held by the team. The two
 * surfaces (Add Card, Add Task) share this theme so the distinction reads the
 * same everywhere.
 */
export type TaskTargetKind = "llm" | "custom";

type TaskTheme = {
    icon: ComponentType<{ className?: string }>;
    label: string;
    accent: string;
    helper: (columnTitle?: string) => string;
};

export const TASK_THEME: Record<TaskTargetKind, TaskTheme> = {
    llm: {
        icon: BoardBuddy,
        label: "LLM board",
        accent: "text-violet-300",
        helper: () => "Lands in To-Do. The agent picks it up.",
    },
    custom: {
        icon: LuColumns3,
        label: "Custom column",
        accent: "text-amber-300",
        helper: (columnTitle) =>
            columnTitle
                ? `Parked in “${columnTitle}”. Your team owns it.`
                : "Parked in a custom column. Your team owns it.",
    },
};

/** Destination chip + trailing helper that signals where a task lives. */
export function TaskTargetBadge({
    kind,
    columnTitle,
}: {
    kind: TaskTargetKind;
    columnTitle?: string;
}) {
    const theme = TASK_THEME[kind];
    const Icon = theme.icon;
    return (
        <span className="inline-flex min-w-0 items-center gap-2">
            <span
                className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium",
                    theme.accent,
                )}
            >
                <Icon className="size-4" aria-hidden />
                {theme.label}
            </span>
            <span className="h-3 w-px shrink-0 bg-white/10" aria-hidden />
            <span className="truncate text-[11.5px] text-neutral-500">
                {theme.helper(columnTitle)}
            </span>
        </span>
    );
}
