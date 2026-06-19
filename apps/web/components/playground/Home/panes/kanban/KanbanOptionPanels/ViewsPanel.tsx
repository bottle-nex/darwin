"use client";
import { Check, Kanban, List, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { KanbanView } from "../types";
import OptionButton from "./OptionButton";
import { PANEL_CONTENT, PANEL_ITEM, PANEL_LABEL } from "./panelStyles";

const OPTIONS: { value: KanbanView; label: string; icon: LucideIcon }[] = [
    { value: "board", label: "Board view", icon: Kanban },
    { value: "list", label: "List view", icon: List },
];

type ViewsPanelProps = {
    value: KanbanView;
    onChange: (value: KanbanView) => void;
};

/**
 * Views dropdown opened from the toolbar's sliders button: switch the LLM
 * Kanban between the board (column) layout and the compact list layout. The
 * trigger stays active while the list layout is selected.
 */
export default function ViewsPanel({ value, onChange }: ViewsPanelProps) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <OptionButton label="Views" icon={SlidersHorizontal} active={value !== "board"} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className={`w-44 ${PANEL_CONTENT}`}
                >
                    <DropdownMenu.Label className={PANEL_LABEL}>Views</DropdownMenu.Label>
                    <DropdownMenu.RadioGroup
                        value={value}
                        onValueChange={(v) => onChange(v as KanbanView)}
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
