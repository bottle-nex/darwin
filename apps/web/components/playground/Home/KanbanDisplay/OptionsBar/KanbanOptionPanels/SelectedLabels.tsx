"use client";
import { MdClose } from "react-icons/md";
import { cn } from "@/lib/utils";
import { getLabel } from "../../data";

type SelectedLabelsProps = {
    selected: string[];
    onRemove: (name: string) => void;
};

/** Chips for the currently-applied label filters, each removable. */
export default function SelectedLabels({ selected, onRemove }: SelectedLabelsProps) {
    if (selected.length === 0) return null;

    return (
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {selected.map((name) => {
                const item = getLabel(name);
                if (!item) return null;
                return (
                    <span
                        key={name}
                        className={cn(
                            "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                            item.className,
                        )}
                    >
                        {name}
                        <button
                            type="button"
                            onClick={() => onRemove(name)}
                            aria-label={`Remove ${name} filter`}
                            className="cursor-pointer opacity-70 hover:opacity-100"
                        >
                            <MdClose className="size-2.5" aria-hidden />
                        </button>
                    </span>
                );
            })}
        </div>
    );
}
