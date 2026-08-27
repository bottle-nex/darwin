"use client";
import {
    AgentIcon,
    CheckIcon,
    DefaultFocusIcon,
    KanbanBoardLayoutIcon,
    KanbanColumnsIcon,
} from "@trymatcha/ui/icons";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useBoardFeed } from "@/hooks/issues/useBoard";
import { useActiveProject } from "@/hooks/useActiveProject";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { cn } from "@/lib/utils";
import type { FocusValue } from "@/store/kanban/useKanbanOptionsStore";

import EagerSubmenu from "./EagerSubmenu";
import OptionButton from "./OptionButton";

type FocusPanelProps = {
    value: FocusValue;
    onChange: (value: FocusValue) => void;
    /** The user's custom columns, listed under the "custom" group. */
    customColumns: { id: string; title: string }[];
};

export const FOCUS_PANEL_WIDTH = "w-48";

/** The menu rows on their own, so they can also be rendered inside a submenu. */
export function FocusPanelItems({ value, onChange, customColumns }: FocusPanelProps) {
    // Only the board this pane is showing can be focused, so the other group
    // is left out entirely rather than shown empty.
    const scope = useBoardFeed(useActiveProject()?.id).scope;
    const hasCustom = customColumns.length > 0;

    return (
        <>
            <DropdownMenuLabel>Focus column</DropdownMenuLabel>

            <DropdownMenuItem onSelect={() => onChange({ kind: "default" })}>
                <DefaultFocusIcon className="size-3.5 text-neutral-400" aria-hidden />
                <span className="flex-1">Default</span>
                {value.kind === "default" && (
                    <CheckIcon className="size-3.5 text-neutral-300" aria-hidden />
                )}
            </DropdownMenuItem>

            {scope.kind === "chapter" &&
                (hasCustom ? (
                    <EagerSubmenu
                        className={`${FOCUS_PANEL_WIDTH} [direction:ltr]`}
                        trigger={
                            <>
                                <KanbanBoardLayoutIcon
                                    className="size-3.5 text-neutral-400"
                                    aria-hidden
                                />
                                <span className="flex-1">Lists</span>
                            </>
                        }
                    >
                        {customColumns.map((col) => (
                            <DropdownMenuItem
                                key={col.id}
                                onSelect={() => onChange({ kind: "custom", columnId: col.id })}
                            >
                                <span className="flex-1 truncate">{col.title}</span>
                                {value.kind === "custom" && value.columnId === col.id && (
                                    <CheckIcon className="size-3.5 text-neutral-300" aria-hidden />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </EagerSubmenu>
                ) : (
                    <DropdownMenuItem disabled>
                        <KanbanBoardLayoutIcon className="size-3.5 text-neutral-400" aria-hidden />
                        <span className="flex-1">Lists</span>
                        <span className="text-[11px] text-neutral-600">No lists yet</span>
                    </DropdownMenuItem>
                ))}

            {scope.kind === "agent" && (
                <EagerSubmenu
                    className={`${FOCUS_PANEL_WIDTH} [direction:ltr]`}
                    trigger={
                        <>
                            <AgentIcon className="size-3.5 text-neutral-400" aria-hidden />
                            <span className="flex-1">Agent</span>
                        </>
                    }
                >
                    {KanbanBoard.COLUMNS.map((col) => (
                        <DropdownMenuItem
                            key={col.status}
                            onSelect={() => onChange({ kind: "llm", status: col.status })}
                        >
                            <col.icon className={cn("size-3.5", col.titleBox)} aria-hidden />
                            <span className="flex-1">{col.title}</span>
                            {value.kind === "llm" && value.status === col.status && (
                                <CheckIcon className="size-3.5 text-neutral-300" aria-hidden />
                            )}
                        </DropdownMenuItem>
                    ))}
                </EagerSubmenu>
            )}
        </>
    );
}

/**
 * Focus column: pick a single column to expand full-width. A chapter pane
 * offers its lists; the agent pane offers the agent statuses. "Default" clears
 * the focus. The trigger stays active while a column is focused.
 *
 * `dir="rtl"` on the root makes the flyouts open to the *left* (Radix derives the
 * submenu side from the root direction); the `[direction:ltr]` class on each panel
 * keeps the rows themselves laid out left-to-right (Radix's `dir` prop isn't typed
 * on the content, so we override the CSS direction directly).
 */
export default function FocusPanel({ value, onChange, customColumns }: FocusPanelProps) {
    return (
        <DropdownMenu dir="rtl">
            <TooltipComponent delayDuration={1000} content="Focus" side="bottom">
                <DropdownMenuTrigger asChild>
                    <OptionButton
                        label="Focus"
                        icon={KanbanColumnsIcon}
                        active={value.kind !== "default"}
                    />
                </DropdownMenuTrigger>
            </TooltipComponent>
            <DropdownMenuContent align="start" className={`${FOCUS_PANEL_WIDTH} [direction:ltr]`}>
                <FocusPanelItems value={value} onChange={onChange} customColumns={customColumns} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
