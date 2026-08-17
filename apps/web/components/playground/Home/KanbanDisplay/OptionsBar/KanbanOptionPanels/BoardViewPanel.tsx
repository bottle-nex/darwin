"use client";
import { MdCheck, MdVerticalSplit, MdViewKanban } from "react-icons/md";
import { LuEye } from "react-icons/lu";
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
import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import type { BoardView } from "@/types/kanban";
import OptionButton from "./OptionButton";
import { TooltipComponent } from "@/components/ui/tooltip-component";

const OPTIONS: { value: BoardView; label: string; icon?: IconType; mascot?: boolean }[] = [
    { value: "llm", label: "Agent", mascot: true },
    { value: "custom", label: "My Board", icon: MdViewKanban },
    { value: "default", label: "Split", icon: MdVerticalSplit },
];

type BoardViewPanelProps = {
    value: BoardView;
    onChange: (value: BoardView) => void;
};

export const BOARD_VIEW_PANEL_WIDTH = "w-44";

/** The menu rows on their own, so they can also be rendered inside a submenu. */
export function BoardViewPanelItems({ value, onChange }: BoardViewPanelProps) {
    return (
        <>
            <DropdownMenuLabel>Board</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as BoardView)}>
                {OPTIONS.map((option) => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.mascot ? (
                            <HeroBuddy move={false} className="size-3.5" />
                        ) : (
                            option.icon && (
                                <option.icon className="size-3.5 text-neutral-400" aria-hidden />
                            )
                        )}
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

/** Which board the pane shows — the agent's columns, the team's own, or both. */
export default function BoardViewPanel({ value, onChange }: BoardViewPanelProps) {
    return (
        <DropdownMenu>
            <TooltipComponent delayDuration={1000} content="Board" side="bottom">
                <DropdownMenuTrigger asChild>
                    <OptionButton label="Board" icon={LuEye} active={value !== "default"} />
                </DropdownMenuTrigger>
            </TooltipComponent>
            <DropdownMenuContent align="end" className={BOARD_VIEW_PANEL_WIDTH}>
                <BoardViewPanelItems value={value} onChange={onChange} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
