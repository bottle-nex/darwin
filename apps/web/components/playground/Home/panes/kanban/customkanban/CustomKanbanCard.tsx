"use client";
import { cn } from "@/lib/utils";
import { getLabel, PRIORITY_DOT } from "../data";
import type { CustomCard } from "./types";

/**
 * A card on the Custom Kanban: title with a priority dot, an optional label
 * chip, and a clamped description preview. Mirrors the LLM board's card look so
 * the two boards read as one product.
 */
export default function CustomKanbanCard({ card }: { card: CustomCard }) {
    const label = card.label ? getLabel(card.label) : undefined;

    return (
        <div className="rounded-lg bg-white/5 p-2.5 ring-1 ring-white/5 transition-colors hover:ring-white/15">
            <div className="flex items-start gap-2">
                <span
                    className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        PRIORITY_DOT[card.priority],
                    )}
                    aria-hidden
                />
                <p className="text-[13px] leading-snug font-medium text-neutral-100">
                    {card.title}
                </p>
            </div>

            {card.description && (
                <p className="mt-1.5 line-clamp-2 pl-3.5 text-[12px] leading-snug text-neutral-400">
                    {card.description}
                </p>
            )}

            {label && (
                <div className="mt-2 pl-3.5">
                    <span
                        className={cn(
                            "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
                            label.className,
                        )}
                    >
                        {label.name}
                    </span>
                </div>
            )}
        </div>
    );
}
