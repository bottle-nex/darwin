"use client";
import { Check, ChevronLeft, Filter, Kanban, LayoutGrid, Sparkles } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { COLUMNS } from "../data";
import type { FilterValue } from "../useKanbanOptions";
import OptionButton from "./OptionButton";
import { PANEL_CONTENT, PANEL_ITEM, PANEL_LABEL } from "./panelStyles";

type FilterPanelProps = {
    value: FilterValue;
    onChange: (value: FilterValue) => void;
    /** The user's custom columns, listed under the "custom" group. */
    customColumns: { id: string; title: string }[];
};

/**
 * Focus filter: pick a single column to expand full-width, grouped by board.
 * "custom" and "LLM" each open a side flyout of their columns (custom lists the
 * user's lists; LLM lists the agent statuses). "Default" clears the focus. The
 * trigger stays active while a column is focused.
 *
 * `dir="rtl"` on the root makes the flyouts open to the *left* (Radix derives the
 * submenu side from the root direction); the `[direction:ltr]` class on each panel
 * keeps the rows themselves laid out left-to-right (Radix's `dir` prop isn't typed
 * on the content, so we override the CSS direction directly).
 */
export default function FilterPanel({ value, onChange, customColumns }: FilterPanelProps) {
    const hasCustom = customColumns.length > 0;

    return (
        <DropdownMenu.Root dir="rtl">
            <DropdownMenu.Trigger asChild>
                <OptionButton label="Filter" icon={Filter} active={value.kind !== "default"} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className={`w-48 [direction:ltr] ${PANEL_CONTENT}`}
                >
                    <DropdownMenu.Label className={PANEL_LABEL}>Focus column</DropdownMenu.Label>

                    <DropdownMenu.Item
                        className={PANEL_ITEM}
                        onSelect={() => onChange({ kind: "default" })}
                    >
                        <LayoutGrid className="size-3.5 text-neutral-400" aria-hidden />
                        <span className="flex-1">Default</span>
                        {value.kind === "default" && (
                            <Check className="size-3.5 text-neutral-300" aria-hidden />
                        )}
                    </DropdownMenu.Item>

                    {hasCustom ? (
                        <DropdownMenu.Sub>
                            <DropdownMenu.SubTrigger className={PANEL_ITEM}>
                                <ChevronLeft className="size-3.5 text-neutral-500" aria-hidden />
                                <Kanban className="size-3.5 text-neutral-400" aria-hidden />
                                <span className="flex-1">Custom</span>
                            </DropdownMenu.SubTrigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.SubContent
                                    sideOffset={6}
                                    className={`w-48 [direction:ltr] ${PANEL_CONTENT}`}
                                >
                                    {customColumns.map((col) => (
                                        <DropdownMenu.Item
                                            key={col.id}
                                            className={PANEL_ITEM}
                                            onSelect={() =>
                                                onChange({ kind: "custom", columnId: col.id })
                                            }
                                        >
                                            <span className="flex-1 truncate">{col.title}</span>
                                            {value.kind === "custom" &&
                                                value.columnId === col.id && (
                                                    <Check
                                                        className="size-3.5 text-neutral-300"
                                                        aria-hidden
                                                    />
                                                )}
                                        </DropdownMenu.Item>
                                    ))}
                                </DropdownMenu.SubContent>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Sub>
                    ) : (
                        <DropdownMenu.Item disabled className={`${PANEL_ITEM} opacity-50`}>
                            <Kanban className="size-3.5 text-neutral-400" aria-hidden />
                            <span className="flex-1">Custom</span>
                            <span className="text-[11px] text-neutral-600">No lists yet</span>
                        </DropdownMenu.Item>
                    )}

                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger className={PANEL_ITEM}>
                            <ChevronLeft className="size-3.5 text-neutral-500" aria-hidden />
                            <Sparkles className="size-3.5 text-neutral-400" aria-hidden />
                            <span className="flex-1">LLM</span>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.SubContent
                                sideOffset={6}
                                className={`w-48 [direction:ltr] ${PANEL_CONTENT}`}
                            >
                                {COLUMNS.map((col) => (
                                    <DropdownMenu.Item
                                        key={col.status}
                                        className={PANEL_ITEM}
                                        onSelect={() =>
                                            onChange({ kind: "llm", status: col.status })
                                        }
                                    >
                                        <col.icon
                                            className="size-3.5 text-neutral-400"
                                            aria-hidden
                                        />
                                        <span className="flex-1">{col.title}</span>
                                        {value.kind === "llm" && value.status === col.status && (
                                            <Check
                                                className="size-3.5 text-neutral-300"
                                                aria-hidden
                                            />
                                        )}
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Sub>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
