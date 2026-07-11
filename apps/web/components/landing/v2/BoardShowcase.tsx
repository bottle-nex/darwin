import {
    MdViewKanban,
    MdLayers,
    MdList,
    MdSearch,
    MdSettings,
    MdShare,
    MdGroup,
} from "react-icons/md";
import { cn } from "@/lib/utils";
import { INITIAL_BOARD } from "@/data/dummy-kanban-issues";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import { HiPlusSmall } from "react-icons/hi2";
import { KanbanStatus, type KanbanColumnDef } from "@/types/kanban";
import CardRenderer from "@/components/playground/Home/KanbanDisplay/cards/CardRenderer";
import { Button } from "@/components/ui/button";

/** Cards shown per column — varied so the board reads naturally, not uniform. */
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

function ShowcaseTopbar() {
    return (
        <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/5 px-3">
            <div className="flex items-center gap-3">
                <h3 className="text-[14px] font-semibold text-neutral-100">Issues</h3>
                <div className="flex items-center gap-0.5">
                    <span className="flex h-7 items-center gap-1.5 rounded-md bg-white/10 px-2 text-[12px] font-medium text-neutral-100">
                        <MdViewKanban className="size-3.5" aria-hidden />
                        Board
                    </span>
                    <span className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-neutral-400">
                        <MdList className="size-3.5" aria-hidden />
                        List
                    </span>
                </div>
            </div>
            <span className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-neutral-300">
                <MdShare className="size-3.5" aria-hidden />
                Share
            </span>
        </div>
    );
}

function ShowcaseOptionsBar() {
    return (
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-3">
            <span className="flex h-7 items-center gap-1.5 rounded-md bg-white/5 px-2 text-[12px] font-medium text-neutral-200 ring-1 ring-white/10">
                <MdLayers className="size-3.5 text-violet-300" aria-hidden />
                Group: Status
            </span>
            <div className="flex items-center gap-0.5 text-neutral-400">
                {[MdGroup, MdSearch, MdSettings].map((Icon, i) => (
                    <span key={i} className="flex size-7 items-center justify-center rounded-md">
                        <Icon className="size-3.5" aria-hidden />
                    </span>
                ))}
                <Button
                    variant={"tertiary"}
                    className="ml-1 flex h-6 items-center rounded-sm bg-neutral-100 px-2 text-[11.5px] font-medium text-neutral-900"
                >
                    Add Task
                </Button>
            </div>
        </div>
    );
}

function ShowcaseColumn({ column }: { column: KanbanColumnDef }) {
    const { icon: Icon, title, titleBox, status } = column;
    const issues = INITIAL_BOARD[status].slice(
        0,
        CARDS_PER_COLUMN[status] ?? DEFAULT_CARDS_PER_COLUMN,
    );

    return (
        <div className="flex w-72 min-w-72 flex-none flex-col rounded-xl bg-white/2.5 p-2 ring-1 ring-white/5">
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                <div
                    className={cn(
                        "flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold",
                        titleBox,
                    )}
                >
                    <Icon className="size-3.5" aria-hidden />
                    <span>{title}</span>
                    <span className="text-[11px] font-medium opacity-60">
                        {INITIAL_BOARD[status].length}
                    </span>
                </div>
            </div>
            <div className="flex flex-col gap-2 p-0.5">
                {issues.map((issue) => (
                    <CardRenderer key={issue.id} issue={issue} />
                ))}
            </div>
        </div>
    );
}

export default function BoardShowcase() {
    return (
        <main className="relative z-40 mx-6 mb-8 mt-[-25vh]">
            <section className="relative z-10 w-full pb-20 sm:pb-28 mx-auto max-w-332 scroll-mt-20 pt-2">
                <div className="rounded-xl px-6">
                    <div className="overflow-hidden rounded-xl outline-8 outline-neutral-200 bg-charcoal shadow-[0_40px_80px_-20px_rgba(15,23,42,0.35)]">
                        <div className="flex h-9 items-center gap-2 border-b border-white/5 px-4">
                            <span className="size-2.5 rounded-full bg-[#FF5F57]" />
                            <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
                            <span className="size-2.5 rounded-full bg-[#28C840]" />
                            <div className="ml-3 font-mono text-[11px] text-neutral-900 bg-primary px-2 py-0.75 rounded-sm flex items-center justify-start">
                                <HiPlusSmall className="mr-1 rotate-45" />
                                <span>app.trymatcha.com</span>
                            </div>
                        </div>
                        <ShowcaseTopbar />
                        <ShowcaseOptionsBar />
                        <div className="relative">
                            <div className="flex min-h-120 gap-4 overflow-x-auto px-3 pt-3 pb-3">
                                {KanbanBoard.COLUMNS.map((column) => (
                                    <ShowcaseColumn key={column.status} column={column} />
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
