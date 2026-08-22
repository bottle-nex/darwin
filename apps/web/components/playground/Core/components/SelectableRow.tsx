"use client";

import type { ComponentPropsWithoutRef } from "react";
import { MdCheck } from "react-icons/md";
import { cn } from "@/lib/utils";

type SelectableRowProps = Omit<ComponentPropsWithoutRef<"div">, "onClick" | "onClickCapture"> & {
    selected: boolean;
    selectionActive: boolean;
    selectionLabel: string;
    onToggleSelection: () => void;
};

export default function SelectableRow({
    selected,
    selectionActive,
    selectionLabel,
    onToggleSelection,
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
                "group/selectable flex items-center gap-3 rounded-md transition-colors hover:bg-snow/5",
                selectionActive && "cursor-pointer select-none",
                selected && "bg-snow/5",
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
                        ? "border-neutral-200 bg-neutral-200 text-neutral-900"
                        : "invisible border-white/25 group-hover/selectable:visible focus-visible:visible",
                )}
            >
                {selected && <MdCheck className="size-2.5" aria-hidden />}
            </button>
            {children}
        </div>
    );
}
