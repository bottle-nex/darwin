"use client";
import type { IconType } from "@trymatcha/ui/icons";
import { BoardViewIcon, KanbanBoardLayoutIcon, KanbanListViewIcon } from "@trymatcha/ui/icons";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { cn } from "@/lib/utils";
import type { KanbanView } from "@/types/kanban";

import OptionButton from "./OptionButton";

const KANBAN_VIEW_TABS: { value: KanbanView; label: string; icon: IconType }[] = [
    { value: "board", label: "Board", icon: KanbanBoardLayoutIcon },
    { value: "list", label: "List", icon: KanbanListViewIcon },
];

export const KANBAN_VIEW_PANEL_WIDTH = "w-44";

type KanbanViewPanelProps = {
    value: KanbanView;
    onChange: (value: KanbanView) => void;
};

/** Board vs. list layout toggle, styled as a tab navbar pinned atop the panel. */
function KanbanViewTabs({ value, onChange }: KanbanViewPanelProps) {
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
export function KanbanViewPanelItems({ value, onChange }: KanbanViewPanelProps) {
    return (
        <>
            <DropdownMenuLabel>Layout</DropdownMenuLabel>
            <KanbanViewTabs value={value} onChange={onChange} />
        </>
    );
}

/** How the pane lays its board out — a column grid or a flat list. */
export default function KanbanViewPanel({ value, onChange }: KanbanViewPanelProps) {
    return (
        <DropdownMenu>
            <TooltipComponent delayDuration={1000} content="Layout" side="bottom">
                <DropdownMenuTrigger asChild>
                    <OptionButton label="Layout" icon={BoardViewIcon} active={value !== "board"} />
                </DropdownMenuTrigger>
            </TooltipComponent>
            <DropdownMenuContent align="end" className={KANBAN_VIEW_PANEL_WIDTH}>
                <KanbanViewPanelItems value={value} onChange={onChange} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
