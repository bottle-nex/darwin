"use client";
import {
    MdFilterAlt,
    MdGroup,
    MdKeyboardArrowDown,
    MdLabel,
    MdSettings,
    MdShare,
    MdTune,
    MdVerticalSplit,
    MdViewKanban,
} from "react-icons/md";
import { cn } from "@/lib/utils";
import { INITIAL_BOARD } from "@/data/dummy-kanban-issues";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { HiPlusSmall } from "react-icons/hi2";
import { KanbanStatus } from "@/types/kanban";
import KanbanColumn from "@/components/playground/Home/KanbanDisplay/KanbanColumn";
import OptionButton from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/OptionButton";
import { OPTIONS_BAR_SHELL } from "@/components/playground/Home/KanbanDisplay/OptionsBar/KanbanOptionsBarParts";
import HeroBuddy from "@/components/landing/v2/HeroBuddy";

const CARDS_PER_COLUMN: Partial<Record<KanbanStatus, number>> = {
    [KanbanStatus.Todo]: 3,
    [KanbanStatus.Queued]: 2,
    [KanbanStatus.InProgress]: 3,
    [KanbanStatus.InReview]: 2,
    [KanbanStatus.Done]: 3,
    [KanbanStatus.Failed]: 2,
    [KanbanStatus.Cancelled]: 2,
};
const DEFAULT_CARDS_PER_COLUMN = 3;

const BOARD_VIEW_TABS = [
    { label: "Agent", mascot: true, active: true },
    { label: "My Board", icon: MdViewKanban },
    { label: "Split", icon: MdVerticalSplit },
];

const OPTION_ICONS = [
    { label: "Tag", icon: MdLabel },
    { label: "Filter", icon: MdFilterAlt },
    { label: "Assignees", icon: MdGroup },
    { label: "Share", icon: MdShare },
    { label: "Views", icon: MdTune },
];

/** Static mirror of the playground's Kanban options bar — same shell, no state. */
function ShowcaseOptionsBar() {
    return (
        <div className={OPTIONS_BAR_SHELL}>
            <div className="flex min-w-0 items-center gap-1.5">
                <div className="flex shrink-0 items-center gap-0.5">
                    {BOARD_VIEW_TABS.map((tab) => (
                        <span
                            key={tab.label}
                            className={cn(
                                "flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium",
                                tab.active ? "bg-white/10 text-neutral-100" : "text-neutral-400",
                            )}
                        >
                            {tab.mascot ? (
                                <HeroBuddy move={false} className="size-4" />
                            ) : (
                                tab.icon && <tab.icon className="size-3.5" aria-hidden />
                            )}
                            {tab.label}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
                {OPTION_ICONS.map((option) => (
                    <OptionButton key={option.label} label={option.label} icon={option.icon} />
                ))}
                <div className="mx-1 h-4 w-px bg-white/8" />
                <OptionButton label="Settings" icon={MdSettings} />
                <div className="ml-1 flex items-center overflow-hidden rounded-sm bg-neutral-100 text-neutral-900">
                    <span className="flex h-6 items-center px-2 text-[11.5px] font-medium">
                        Add Task
                    </span>
                    <span className="flex h-6 items-center px-1">
                        <MdKeyboardArrowDown className="size-3.5" aria-hidden />
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function BoardShowcase() {
    return (
        <main className="relative z-40 mx-6 mb-8 mt-[-25vh]">
            <section className="relative z-10 w-full pb-20 sm:pb-28 mx-auto max-w-332 scroll-mt-20 pt-2">
                <div className="rounded-xl px-6">
                    <div className="overflow-hidden rounded-xl ring-2 ring-white/5 ">
                        <div className="flex h-9 items-center gap-2 border-b border-white/5 px-4">
                            <span className="size-2.5 rounded-full bg-[#FF5F57]" />
                            <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
                            <span className="size-2.5 rounded-full bg-[#28C840]" />
                            <div className="ml-3 font-mono text-[11px] text-neutral-900 bg-primary px-2 py-0.75 rounded-sm flex items-center justify-start">
                                <HiPlusSmall className="mr-1 rotate-45" />
                                <span>app.trymatcha.com</span>
                            </div>
                        </div>
                        <ShowcaseOptionsBar />
                        <div className="relative">
                            <div className="flex min-h-120 gap-4 overflow-x-auto px-3 pt-3 pb-3">
                                {KanbanBoard.COLUMNS.map((column) => (
                                    <KanbanColumn
                                        key={column.status}
                                        column={column}
                                        issues={INITIAL_BOARD[column.status].slice(
                                            0,
                                            CARDS_PER_COLUMN[column.status] ??
                                                DEFAULT_CARDS_PER_COLUMN,
                                        )}
                                    />
                                ))}
                            </div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-charcoal to-transparent" />
                            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-linear-to-r from-charcoal to-transparent" />
                            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-charcoal to-transparent" />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
