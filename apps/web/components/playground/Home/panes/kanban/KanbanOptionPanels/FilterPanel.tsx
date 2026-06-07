"use client";
import { Check, Filter, LayoutGrid, type LucideIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { COLUMNS } from "../data";
import type { FilterValue } from "../useKanbanOptions";
import OptionButton from "./OptionButton";
import { PANEL_CONTENT, PANEL_ITEM, PANEL_LABEL } from "./panelStyles";

const OPTIONS: { value: FilterValue; label: string; icon: LucideIcon }[] = [
    { value: "default", label: "Default", icon: LayoutGrid },
    ...COLUMNS.map((c) => ({ value: c.status, label: c.title, icon: c.icon })),
];

type FilterPanelProps = {
    value: FilterValue;
    onChange: (value: FilterValue) => void;
};

/**
 * Filter dropdown: pick "Default" (the normal board) or a single status to
 * expand full-width as a grid. The trigger stays active while a status is
 * focused.
 */
export default function FilterPanel({ value, onChange }: FilterPanelProps) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <OptionButton label="Filter" icon={Filter} active={value !== "default"} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className={`w-48 ${PANEL_CONTENT}`}
                >
                    <DropdownMenu.Label className={PANEL_LABEL}>
                        Filter by status
                    </DropdownMenu.Label>
                    <DropdownMenu.RadioGroup
                        value={value}
                        onValueChange={(v) => onChange(v as FilterValue)}
                    >
                        {OPTIONS.map((option) => (
                            <DropdownMenu.RadioItem
                                key={option.value}
                                value={option.value}
                                className={PANEL_ITEM}
                            >
                                <option.icon className="size-3.5 text-neutral-400" aria-hidden />
                                <span className="flex-1">{option.label}</span>
                                <DropdownMenu.ItemIndicator>
                                    <Check className="size-3.5 text-neutral-300" aria-hidden />
                                </DropdownMenu.ItemIndicator>
                            </DropdownMenu.RadioItem>
                        ))}
                    </DropdownMenu.RadioGroup>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
