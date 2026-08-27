"use client";
import type { IconType } from "@trymatcha/ui/icons";
import {
    BoardSplitViewIcon,
    BoardViewIcon,
    CheckIcon,
    KanbanBoardLayoutIcon,
    KanbanListViewIcon,
} from "@trymatcha/ui/icons";
import { motion } from "motion/react";

import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItemIndicator,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { cn } from "@/lib/utils";
import type { BoardView, KanbanView } from "@/types/kanban";

import OptionButton from "./OptionButton";

const OPTIONS: { value: BoardView; label: string; icon?: IconType; mascot?: boolean }[] = [
    { value: "llm", label: "Agent", mascot: true },
    { value: "custom", label: "My Board", icon: KanbanBoardLayoutIcon },
    { value: "default", label: "Split", icon: BoardSplitViewIcon },
];

const KANBAN_VIEW_TABS: { value: KanbanView; label: string; icon: IconType }[] = [
    { value: "board", label: "Board", icon: KanbanBoardLayoutIcon },
    { value: "list", label: "List", icon: KanbanListViewIcon },
];

type BoardViewPanelProps = {
    value: BoardView;
    onChange: (value: BoardView) => void;
    kanbanView: KanbanView;
    onKanbanViewChange: (view: KanbanView) => void;
};

export const BOARD_VIEW_PANEL_WIDTH = "w-44";

/** Board vs. list layout toggle, styled as a tab navbar pinned atop the panel. */
function KanbanViewTabs({
    value,
    onChange,
}: {
    value: KanbanView;
    onChange: (value: KanbanView) => void;
}) {
    return (
        <div role="tablist" aria-label="Kanban view" className="flex items-center gap-1 p-1">
            {KANBAN_VIEW_TABS.map((tab) => (
                <Button
                    key={tab.value}
                    variant="unstyled"
                    type="button"
                    role="tab"
                    aria-selected={value === tab.value}
                    onClick={() => onChange(tab.value)}
                    className={cn(
                        "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xs px-1 py-1 text-[13.5px] font-medium transition-colors",
                        value === tab.value
                            ? "text-snow"
                            : "text-neutral-500 hover:text-neutral-300",
                    )}
                >
                    {value === tab.value && (
                        <motion.div
                            layoutId="kanban-view-tab-bg"
                            className="absolute inset-0 rounded-full border border-snow/5 bg-snow/4 shadow-sm shadow-black/7"
                            transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
                        />
                    )}
                    <tab.icon className="relative size-3.5" aria-hidden />
                    <span className="relative">{tab.label}</span>
                </Button>
            ))}
        </div>
    );
}

/** The menu rows on their own, so they can also be rendered inside a submenu. */
export function BoardViewPanelItems({
    value,
    onChange,
    kanbanView,
    onKanbanViewChange,
}: BoardViewPanelProps) {
    return (
        <>
            <DropdownMenuLabel>Board</DropdownMenuLabel>
            <KanbanViewTabs value={kanbanView} onChange={onKanbanViewChange} />
            <DropdownMenuSeparator className="my-1 h-px bg-white/5" />
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
                            <CheckIcon className="size-3.5 text-neutral-300" aria-hidden />
                        </DropdownMenuItemIndicator>
                    </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
        </>
    );
}

/** Which board the pane shows — the agent's columns, the team's own, or both. */
export default function BoardViewPanel({
    value,
    onChange,
    kanbanView,
    onKanbanViewChange,
}: BoardViewPanelProps) {
    return (
        <DropdownMenu>
            <TooltipComponent delayDuration={1000} content="Board" side="bottom">
                <DropdownMenuTrigger asChild>
                    <OptionButton
                        label="Board"
                        icon={BoardViewIcon}
                        active={value !== "default" || kanbanView !== "board"}
                    />
                </DropdownMenuTrigger>
            </TooltipComponent>
            <DropdownMenuContent align="end" className={BOARD_VIEW_PANEL_WIDTH}>
                <BoardViewPanelItems
                    value={value}
                    onChange={onChange}
                    kanbanView={kanbanView}
                    onKanbanViewChange={onKanbanViewChange}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
