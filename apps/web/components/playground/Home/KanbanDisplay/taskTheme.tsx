import { MdAutoAwesome, MdViewColumn } from "react-icons/md";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

/**
 * Where a freshly created task lands. `llm` joins the agent-driven LLM board as
 * To-Do; `custom` is parked in a user-built column and held by the team. The two
 * surfaces (Add Card, Add Task) share this theme so the distinction reads the
 * same everywhere.
 */
export type TaskTargetKind = "llm" | "custom";

type TaskTheme = {
    icon: IconType;
    label: string;
    badge: string;
    helper: (columnTitle?: string) => string;
};

export const TASK_THEME: Record<TaskTargetKind, TaskTheme> = {
    llm: {
        icon: MdAutoAwesome,
        label: "LLM board",
        badge: "bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/30",
        helper: () => "Joins the LLM board as To-Do. The agent picks this up.",
    },
    custom: {
        icon: MdViewColumn,
        label: "Custom column",
        badge: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
        helper: (columnTitle) =>
            columnTitle
                ? `Parked in “${columnTitle}”. Held by your team, not auto-picked.`
                : "Parked in a custom column. Held by your team, not auto-picked.",
    },
};

/** Accent chip + helper line that signals where a new task will land. */
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
        <div className="flex flex-col gap-1.5">
            <span
                className={cn(
                    "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                    theme.badge,
                )}
            >
                <Icon className="size-3" aria-hidden />
                {theme.label}
            </span>
            <span className="text-[11.5px] text-neutral-500">{theme.helper(columnTitle)}</span>
        </div>
    );
}
