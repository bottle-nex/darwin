import { Kanban, Layers, List, Search, Settings2, Share2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLUMNS, INITIAL_BOARD } from "@/components/playground/Home/panes/kanban/data";
import { HiPlusSmall } from "react-icons/hi2";
import type { KanbanColumnDef } from "@/components/playground/Home/panes/kanban/types";
import CardRenderer from "@/components/playground/Home/panes/kanban/cards/CardRenderer";
import Reveal from "@/components/utility/Reveal";
import { Button } from "@/components/ui/button";

const CARDS_PER_COLUMN = 3;

function ShowcaseTopbar() {
    return (
        <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/5 px-3">
            <div className="flex items-center gap-3">
                <h3 className="text-[14px] font-semibold text-neutral-100">Issues</h3>
                <div className="flex items-center gap-0.5">
                    <span className="flex h-7 items-center gap-1.5 rounded-md bg-white/10 px-2 text-[12px] font-medium text-neutral-100">
                        <Kanban className="size-3.5" aria-hidden />
                        Board
                    </span>
                    <span className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-neutral-400">
                        <List className="size-3.5" aria-hidden />
                        List
                    </span>
                </div>
            </div>
            <span className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-neutral-300">
                <Share2 className="size-3.5" aria-hidden />
                Share
            </span>
        </div>
    );
}

function ShowcaseOptionsBar() {
    return (
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-3">
            <span className="flex h-7 items-center gap-1.5 rounded-md bg-white/5 px-2 text-[12px] font-medium text-neutral-200 ring-1 ring-white/10">
                <Layers className="size-3.5 text-violet-300" aria-hidden />
                Group: Status
            </span>
            <div className="flex items-center gap-0.5 text-neutral-400">
                {[Users, Search, Settings2].map((Icon, i) => (
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

function ShowcaseColumn({ column, columnIndex }: { column: KanbanColumnDef; columnIndex: number }) {
    const { icon: Icon, title, titleBox, status } = column;
    const issues = INITIAL_BOARD[status].slice(0, CARDS_PER_COLUMN);

    return (
        <Reveal
            delay={0.15 + columnIndex * 0.08}
            className="flex w-60 flex-none flex-col rounded-xl bg-white/2.5 p-2 ring-1 ring-white/5 lg:w-auto lg:min-w-0 lg:flex-1"
        >
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
        </Reveal>
    );
}

export default function BoardShowcase() {
    return (
        <main className="relative mx-6 mb-8 squircle rounded-[118px] bg-linear-to-b from-transparent via-primary/30 to-primary/80">
            <section className="w-full pb-20 sm:pb-28 mx-auto max-w-332 scroll-mt-20 pt-2">
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
                            <div className="flex gap-4 overflow-x-auto px-3 pt-3 pb-3">
                                {COLUMNS.map((column, i) => (
                                    <ShowcaseColumn
                                        key={column.status}
                                        column={column}
                                        columnIndex={i}
                                    />
                                ))}
                            </div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-charcoal to-transparent" />
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
