"use client";
import { SearchIcon } from "@trymatcha/ui/icons";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import KeyCombo from "@/components/ui/KeyCombo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    comboToKeys,
    COMMAND_ENTRIES,
    isCommandAvailable,
} from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { cn } from "@/lib/utils";
import { useCommandContextStore } from "@/store/command/useCommandContextStore";
import { useShortcutSheetStore } from "@/store/playground/useShortcutSheetStore";
import { COMMAND_KIND_ORDER } from "@/types/command.type";

export default function PlaygroundShortcutSheet() {
    const isOpen = useShortcutSheetStore((s) => s.isOpen);
    const setOpen = useShortcutSheetStore((s) => s.setOpen);
    const orgSlug = useCommandContextStore((s) => s.orgSlug);
    const projectId = useCommandContextStore((s) => s.projectId);
    const issueId = useCommandContextStore((s) => s.issueId);
    const [query, setQuery] = useState("");

    const context = { orgSlug, projectId, issueId };
    const normalized = query.trim().toLowerCase();

    const groups = COMMAND_KIND_ORDER.map((kind) => ({
        kind,
        entries: COMMAND_ENTRIES.filter(
            (entry) =>
                entry.kind === kind &&
                (!normalized || entry.label.toLowerCase().includes(normalized)),
        ),
    })).filter((group) => group.entries.length > 0);

    function handleOpenChange(open: boolean) {
        setOpen(open);
        if (!open) setQuery("");
    }

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
                        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search shortcuts"
                            className="h-9 pl-9 text-[13px] bg-cement shadow-none"
                        />
                    </div>
                </SheetHeader>

                <div data-lenis-prevent className="flex flex-col gap-5 overflow-y-auto p-4">
                    {groups.map((group) => (
                        <div key={group.kind} className="flex flex-col gap-1">
                            <h3 className="px-1 pb-0.5 text-xs font-medium tracking-wide text-neutral-300">
                                {group.kind}
                            </h3>
                            {group.entries.map((entry) => (
                                <div
                                    key={entry.combo}
                                    className={cn(
                                        "flex items-center justify-between rounded-md px-1 py-1.5",
                                        !isCommandAvailable(entry, context) && "opacity-40",
                                    )}
                                >
                                    <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-neutral-500">
                                        <entry.icon className="size-3.5 shrink-0" aria-hidden />
                                        <span className="truncate">{entry.label}</span>
                                    </span>
                                    <KeyCombo keys={comboToKeys(entry.combo)} />
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
