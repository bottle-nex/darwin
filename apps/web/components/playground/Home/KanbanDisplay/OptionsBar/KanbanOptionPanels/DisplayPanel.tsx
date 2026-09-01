"use client";
import {
    CheckIcon,
    KanbanBoardLayoutIcon,
    KanbanListViewIcon,
    OptionsMenuIcon,
} from "@trymatcha/ui/icons";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { groupIcon, groupLabel } from "@/hooks/issues/useGroupOptions";
import type { IssueLayout } from "@/hooks/issues/useIssueView";
import { type IssueGroupBy, NO_GROUPING } from "@/lib/kanban/issueGrouping";
import { cn } from "@/lib/utils";

export const DISPLAY_PANEL_WIDTH = "w-52";

const LAYOUTS = [
    { value: "board", label: "Board", icon: KanbanBoardLayoutIcon },
    { value: "list", label: "List", icon: KanbanListViewIcon },
] as const;

type DisplayPanelProps = {
    layout: IssueLayout;
    groupBy: IssueGroupBy;
    groupings: IssueGroupBy[];
    onLayoutChange: (layout: IssueLayout) => void;
    onGroupByChange: (groupBy: IssueGroupBy) => void;
};

/** Board vs. list, styled as a tab navbar pinned atop the panel. */
function LayoutTabs({
    layout,
    onLayoutChange,
}: Pick<DisplayPanelProps, "layout" | "onLayoutChange">) {
    return (
        <div role="tablist" aria-label="Layout" className="flex items-center gap-1 p-1">
            {LAYOUTS.map((tab) => (
                <Button
                    key={tab.value}
                    variant="unstyled"
                    type="button"
                    role="tab"
                    aria-selected={layout === tab.value}
                    onClick={() => onLayoutChange(tab.value)}
                    className={cn(
                        "relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xs px-1 py-1 text-[13.5px] font-medium transition-colors",
                        layout === tab.value
                            ? "text-snow"
                            : "text-neutral-500 hover:text-neutral-300",
                    )}
                >
                    {layout === tab.value && (
                        <motion.div
                            layoutId="issue-layout-tab-bg"
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
export function DisplayPanelItems({
    layout,
    groupBy,
    groupings,
    onLayoutChange,
    onGroupByChange,
}: DisplayPanelProps) {
    // A board is its grouping, so it has nowhere to put ungrouped issues.
    const available =
        layout === "board" ? groupings.filter((key) => key !== NO_GROUPING) : groupings;

    return (
        <>
            <DropdownMenuLabel>Layout</DropdownMenuLabel>
            <LayoutTabs layout={layout} onLayoutChange={onLayoutChange} />

            <DropdownMenuLabel>Grouping</DropdownMenuLabel>
            {available.map((key) => {
                const Glyph = groupIcon(key) ?? KanbanListViewIcon;
                return (
                    <DropdownMenuItem key={key} onSelect={() => onGroupByChange(key)}>
                        <Glyph
                            className={cn(
                                "size-3.5",
                                key === groupBy ? "text-neutral-200" : "text-neutral-400",
                            )}
                            aria-hidden
                        />
                        <span className="flex-1">{groupLabel(key)}</span>
                        {key === groupBy && (
                            <CheckIcon className="size-3.5 text-neutral-300" aria-hidden />
                        )}
                    </DropdownMenuItem>
                );
            })}
        </>
    );
}

/** How a pane lays its issues out: the shape on screen, and what splits them up. */
export default function DisplayPanel(props: DisplayPanelProps) {
    return (
        <DropdownMenu>
            <TooltipComponent delayDuration={1000} content="Display" side="bottom">
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="unstyled"
                        type="button"
                        aria-label="Display"
                        className="flex size-6.75 shrink-0 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent text-neutral-400 transition-colors hover:bg-white/8 hover:text-neutral-200"
                    >
                        <OptionsMenuIcon className="size-3.75" aria-hidden />
                    </Button>
                </DropdownMenuTrigger>
            </TooltipComponent>
            <DropdownMenuContent align="end" className={DISPLAY_PANEL_WIDTH}>
                <DisplayPanelItems {...props} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
