"use client";

import { CheckIcon } from "@trymatcha/ui/icons";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

import { SELECTED_TINT } from "./selectionStyles";

type SelectableRowProps = Omit<ComponentPropsWithoutRef<"div">, "onClick" | "onClickCapture"> & {
    selected: boolean;
    selectionActive: boolean;
    selectionLabel: string;
    onToggleSelection: () => void;
    /** The row directly above is selected too, so this one's top corners square off. */
    joinedAbove?: boolean;
    /** The row directly below is selected too, so this one's bottom corners square off. */
    joinedBelow?: boolean;
};

/**
 * A row that can be checked off a list. A run of selected rows reads as one block:
 * only the outer corners of the run stay round.
 */
export default function SelectableRow({
    selected,
    selectionActive,
    selectionLabel,
    onToggleSelection,
    joinedAbove,
    joinedBelow,
    className,
    children,
    ...props
}: SelectableRowProps) {
    return (
        <div
            {...props}
            onClickCapture={(event) => {
                if (!selectionActive) return;
                event.preventDefault();
                event.stopPropagation();
                onToggleSelection();
            }}
            className={cn(
                "group/selectable flex items-center gap-3 rounded-md transition-colors",
                selectionActive && "cursor-pointer select-none",
                selected ? "bg-active" : "hover:bg-hover",
                className,
            )}
        >
            <button
                type="button"
                role="checkbox"
                aria-checked={selected}
                aria-label={selectionLabel}
                onClick={(event) => {
                    event.stopPropagation();
                    onToggleSelection();
                }}
                className={cn(
                    "flex size-3.5 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    selected
                        ? "border-primary bg-primary text-ink"
                        : "invisible border-white/25 group-hover/selectable:visible focus-visible:visible",
                )}
            >
                {selected && <CheckIcon className="size-2.5" aria-hidden />}
            </button>
            {children}
        </div>
    );
}
