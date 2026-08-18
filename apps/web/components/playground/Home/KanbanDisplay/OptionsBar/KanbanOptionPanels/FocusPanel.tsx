"use client";
import { MdAutoAwesome, MdCheck, MdViewKanban, MdWindow } from "react-icons/md";
import { LuColumns3 } from "react-icons/lu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type { FocusValue } from "@/store/kanban/useKanbanOptionsStore";
import OptionButton from "./OptionButton";
import EagerSubmenu from "./EagerSubmenu";
import { TooltipComponent } from "@/components/ui/tooltip-component";

type FocusPanelProps = {
    value: FocusValue;
    onChange: (value: FocusValue) => void;
    /** The user's custom columns, listed under the "custom" group. */
    customColumns: { id: string; title: string }[];
};

export const FOCUS_PANEL_WIDTH = "w-48";

/** The menu rows on their own, so they can also be rendered inside a submenu. */
export function FocusPanelItems({ value, onChange, customColumns }: FocusPanelProps) {
    const hasCustom = customColumns.length > 0;

    return (
        <>
            <DropdownMenuLabel>Focus column</DropdownMenuLabel>

            <DropdownMenuItem onSelect={() => onChange({ kind: "default" })}>
                <MdWindow className="size-3.5 text-neutral-400" aria-hidden />
                <span className="flex-1">Default</span>
                {value.kind === "default" && (
                    <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
                )}
            </DropdownMenuItem>

            {hasCustom ? (
                <EagerSubmenu
                    className={`${FOCUS_PANEL_WIDTH} [direction:ltr]`}
                    trigger={
                        <>
                            <MdViewKanban className="size-3.5 text-neutral-400" aria-hidden />
                            <span className="flex-1">Custom</span>
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
                                <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
                            )}
                        </DropdownMenuItem>
                    ))}
                </EagerSubmenu>
            ) : (
                <DropdownMenuItem disabled>
                    <MdViewKanban className="size-3.5 text-neutral-400" aria-hidden />
                    <span className="flex-1">Custom</span>
                    <span className="text-[11px] text-neutral-600">No lists yet</span>
                </DropdownMenuItem>
            )}

            <EagerSubmenu
                className={`${FOCUS_PANEL_WIDTH} [direction:ltr]`}
                trigger={
                    <>
                        <MdAutoAwesome className="size-3.5 text-neutral-400" aria-hidden />
                        <span className="flex-1">LLM</span>
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
                            <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
                        )}
                    </DropdownMenuItem>
                ))}
            </EagerSubmenu>
        </>
    );
}

/**
 * Focus column: pick a single column to expand full-width, grouped by board.
 * "custom" and "LLM" each open a side flyout of their columns (custom lists the
 * user's lists; LLM lists the agent statuses). "Default" clears the focus. The
 * trigger stays active while a column is focused.
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
                        icon={LuColumns3}
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
