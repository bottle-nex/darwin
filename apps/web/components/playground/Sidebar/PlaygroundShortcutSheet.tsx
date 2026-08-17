"use client";
import { useState } from "react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { COMBINATIONS } from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { useShortcutSheetStore } from "@/store/playground/useShortcutSheetStore";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import KeyCombo from "@/components/ui/KeyCombo";

interface ShortcutRow {
    label: string;
    keys: string[];
}

interface ShortcutGroup {
    heading: string;
    rows: ShortcutRow[];
}

export default function PlaygroundShortcutSheet() {
    const isOpen = useShortcutSheetStore((s) => s.isOpen);
    const setOpen = useShortcutSheetStore((s) => s.setOpen);
    const [query, setQuery] = useState("");

    function comboToKeys(combo: string): string[] {
        return combo
            .split(" ")
            .flatMap((token) => (token.startsWith("mod+") ? ["⌘", token.slice(4)] : [token]));
    }

    const allGroups: ShortcutGroup[] = [
        {
            heading: "Shortcuts",
            rows: Object.entries(COMBINATIONS).map(([combo, { label }]) => ({
                label,
                keys: comboToKeys(combo),
            })),
        },
    ];

    function filterGroups(query: string): ShortcutGroup[] {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return allGroups;
        return allGroups
            .map((group) => ({
                ...group,
                rows: group.rows.filter((row) => row.label.toLowerCase().includes(normalized)),
            }))
            .filter((group) => group.rows.length > 0);
    }

    function handleOpenChange(open: boolean) {
        setOpen(open);
        if (!open) setQuery("");
    }

    const groups = filterGroups(query);

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent
                side="right"
                className="top-3 right-3 bottom-3 h-auto w-90 max-w-[calc(100%-1.5rem)] gap-0 rounded-2xl border border-white/5 text-neutral-100 shadow-xl will-change-transform ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:duration-200 data-[state=open]:duration-300"
            >
                <SheetHeader className="gap-3 px-4 py-4">
                    <SheetTitle className="text-[15px] font-semibold text-neutral-100">
                        Keyboard shortcuts
                    </SheetTitle>
                    <div className="relative">
                        <HiOutlineMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search shortcuts"
                            className="h-9 pl-9 text-[13px] bg-cement shadow-none"
                        />
                    </div>
                </SheetHeader>

                <div className="flex flex-col gap-5 overflow-y-auto p-4">
                    {groups.map((group) => (
                        <div key={group.heading} className="flex flex-col gap-1">
                            <h3 className="px-1 pb-0.5 text-xs font-medium tracking-wide text-neutral-300">
                                {group.heading}
                            </h3>
                            {group.rows.map((row) => (
                                <div
                                    key={row.label}
                                    className="flex items-center justify-between rounded-md px-1 py-1.5"
                                >
                                    <span className="text-[12.5px] text-neutral-500">
                                        {row.label}
                                    </span>
                                    <KeyCombo keys={row.keys} />
                                </div>
                            ))}
                        </div>
                    ))}
                    {groups.length === 0 && (
                        <p className="px-1 py-6 text-center text-[13px] text-neutral-500">
                            No shortcuts found.
                        </p>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
