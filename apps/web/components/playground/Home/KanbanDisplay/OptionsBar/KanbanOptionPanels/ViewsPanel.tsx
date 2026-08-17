"use client";
import { MdCheck, MdViewKanban, MdList, MdTune } from "react-icons/md";
import { type IconType } from "react-icons";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItemIndicator,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KanbanView } from "@/types/kanban";
import OptionButton from "./OptionButton";
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
            <DropdownMenuLabel>Views</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as KanbanView)}>
                {OPTIONS.map((option) => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                        <option.icon className="size-3.5 text-neutral-400" aria-hidden />
                        <span className="flex-1">{option.label}</span>
                        <DropdownMenuItemIndicator>
                            <MdCheck className="size-3.5 text-neutral-300" aria-hidden />
                        </DropdownMenuItemIndicator>
                    </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
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
        <DropdownMenu>
            <TooltipComponent delayDuration={1000} content="Views" side="bottom">
                <DropdownMenuTrigger asChild>
                    <OptionButton label="Views" icon={MdTune} active={value !== "board"} />
                </DropdownMenuTrigger>
            </TooltipComponent>
            <DropdownMenuContent align="end" className={VIEWS_PANEL_WIDTH}>
                <ViewsPanelItems value={value} onChange={onChange} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
