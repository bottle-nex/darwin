"use client";
import { Kanban, List, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanView } from "./types";

const VIEWS: { id: KanbanView; label: string; icon: typeof Kanban }[] = [
    { id: "board", label: "Board", icon: Kanban },
    { id: "list", label: "List", icon: List },
];

type KanbanTopbarProps = {
    view: KanbanView;
    onViewChange: (view: KanbanView) => void;
};

/** Board header: title, view switcher (Board / List), and actions. */
export default function KanbanTopbar({ view, onViewChange }: KanbanTopbarProps) {
    return (
        <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/5 px-3">
            <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-semibold text-neutral-100">Issues</h2>
                <div className="flex items-center gap-0.5">
                    {VIEWS.map((v) => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => onViewChange(v.id)}
                            className={cn(
                                "flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[12px] font-medium transition-colors",
                                view === v.id
                                    ? "bg-white/10 text-neutral-100"
                                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                            )}
                        >
                            <v.icon className="size-3.5" aria-hidden />
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-neutral-300 hover:bg-white/5 hover:text-neutral-100"
                >
                    <Share2 className="size-3.5" aria-hidden />
                    Share
                </button>
            </div>
        </header>
    );
}
