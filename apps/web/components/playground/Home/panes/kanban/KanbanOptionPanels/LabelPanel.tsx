"use client";
import { useState } from "react";
import { Check, Search, Tag } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";
import { ALL_LABELS } from "../data";
import OptionButton from "./OptionButton";

type LabelPanelProps = {
    selected: string[];
    onToggle: (name: string) => void;
    onClear: () => void;
};

// Same dark popover as the other panels, but without padding (the header,
// divider, and scroll area manage their own) and clipped so corners stay round.
const CONTENT =
    "z-50 flex max-h-76 w-60 flex-col overflow-hidden origin-(--radix-dropdown-menu-content-transform-origin) rounded-lg border border-neutral-800 bg-charcoal shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95";

/**
 * Label filter. A sticky header (title + Clear all, then a label search) sits
 * above a divider; only the checklist below scrolls. Selecting keeps the menu
 * open so several labels can be toggled at once, and narrows the board to issues
 * carrying any selected label.
 */
export default function LabelPanel({ selected, onToggle, onClear }: LabelPanelProps) {
    const [query, setQuery] = useState("");
    const labels = ALL_LABELS.filter((l) =>
        l.name.toLowerCase().includes(query.trim().toLowerCase()),
    );

    return (
        <DropdownMenu.Root onOpenChange={(open) => !open && setQuery("")}>
            <DropdownMenu.Trigger asChild>
                <OptionButton label="Label" icon={Tag} active={selected.length > 0} />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={6} className={CONTENT}>
                    <div className="flex shrink-0 flex-col gap-1.5 p-2">
                        <div className="flex items-center justify-between px-0.5">
                            <span className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                                Filter by label
                            </span>
                            {selected.length > 0 && (
                                <button
                                    type="button"
                                    onClick={onClear}
                                    className="cursor-pointer bg-transparent text-[11px] font-medium text-neutral-400 hover:text-neutral-100"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-neutral-500"
                                aria-hidden
                            />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                placeholder="Search labels..."
                                className="h-7 w-full rounded-md border border-white/10 bg-white/5 pr-2 pl-7 text-[12px] text-neutral-100 placeholder:text-neutral-500 focus:border-white/25 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="h-px shrink-0 bg-white/5" />

                    {/* Scrollable checklist. */}
                    <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto p-1">
                        {labels.length === 0 ? (
                            <p className="px-2 py-3 text-center text-[12px] text-neutral-600">
                                No labels
                            </p>
                        ) : (
                            labels.map((item) => {
                                const isOn = selected.includes(item.name);
                                return (
                                    <DropdownMenu.CheckboxItem
                                        key={item.name}
                                        checked={isOn}
                                        onCheckedChange={() => onToggle(item.name)}
                                        onSelect={(e) => e.preventDefault()}
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-highlighted:bg-white/5"
                                    >
                                        <span
                                            className={cn(
                                                "flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                                                isOn
                                                    ? "border-neutral-200 bg-neutral-200 text-neutral-900"
                                                    : "border-white/25",
                                            )}
                                        >
                                            {isOn && (
                                                <Check
                                                    className="size-2.5"
                                                    strokeWidth={3}
                                                    aria-hidden
                                                />
                                            )}
                                        </span>
                                        <span
                                            className={cn(
                                                "rounded px-1.5 py-0.5 text-[11px] font-medium",
                                                item.className,
                                            )}
                                        >
                                            {item.name}
                                        </span>
                                    </DropdownMenu.CheckboxItem>
                                );
                            })
                        )}
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
