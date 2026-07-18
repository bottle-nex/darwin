"use client";
import { MdCheck, MdViewKanban, MdList, MdTune } from "react-icons/md";
import { type IconType } from "react-icons";
import { DropdownMenu } from "radix-ui";
import type { KanbanView } from "@/types/kanban";
import OptionButton from "./OptionButton";
import { PANEL_CONTENT, PANEL_ITEM, PANEL_LABEL } from "./panelStyles";
import { TooltipComponent } from "@/components/ui/tooltip-component";

const OPTIONS: { value: KanbanView; label: string; icon: IconType }[] = [
    { value: "board", label: "Board view", icon: MdViewKanban },
    { value: "list", label: "List view", icon: MdList },
];

type ViewsPanelProps = {
    value: KanbanView;
    onChange: (value: KanbanView) => void;
};

export const VIEWS_PANEL_WIDTH = "w-44";

/** The menu rows on their own, so they can also be rendered inside a submenu. */
export function ViewsPanelItems({ value, onChange }: ViewsPanelProps) {
    return (
        <>
            <DropdownMenu.Label className={PANEL_LABEL}>Views</DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={value} onValueChange={(v) => onChange(v as KanbanView)}>
                {OPTIONS.map((option) => (
                    <DropdownMenu.RadioItem
                        key={option.value}
                        value={option.value}
                        className={PANEL_ITEM}
                    >
                        <option.icon className="size-3.5 text-neutral-400" aria-hidden />
                        <span className="flex-1">{option.label}</span>
                        <DropdownMenu.ItemIndicator>
                            <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
                        </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                ))}
            </DropdownMenu.RadioGroup>
        </>
    );
}

/**
 * Views dropdown opened from the toolbar's sliders button: switch the LLM
 * Kanban between the board (column) layout and the compact list layout. The
 * trigger stays active while the list layout is selected.
 */
export default function ViewsPanel({ value, onChange }: ViewsPanelProps) {
    return (
        <DropdownMenu.Root>
            <TooltipComponent content="Views" side="bottom">
                <DropdownMenu.Trigger asChild>
                    <OptionButton label="Views" icon={MdTune} active={value !== "board"} />
                </DropdownMenu.Trigger>
            </TooltipComponent>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className={`${VIEWS_PANEL_WIDTH} ${PANEL_CONTENT}`}
                >
                    <ViewsPanelItems value={value} onChange={onChange} />
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
