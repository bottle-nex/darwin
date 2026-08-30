"use client";
import type { SettingsItem } from "@/components/playground/Sidebar/settingsItems";
import { cn } from "@/lib/utils";

export default function OverviewTile({
    item,
    isTopMatch,
    onOpen,
}: {
    item: SettingsItem;
    isTopMatch: boolean;
    onOpen: (item: SettingsItem) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onOpen(item)}
            className={cn(
                "group flex w-full cursor-pointer items-center gap-3.5 rounded-lg p-3 text-left outline-none transition-colors hover:bg-hover focus-visible:bg-hover",
                isTopMatch && "bg-active",
            )}
        >
            <span className="relative size-10 shrink-0">
                <span className="absolute top-1/2 -left-1 h-8.5 w-8.5 -translate-y-1/2 -rotate-12 rounded-[9px] border border-snow/7 bg-graphite/60" />
                <span className="absolute top-1/2 -right-1 h-8.5 w-8.5 -translate-y-1/2 rotate-12 rounded-[9px] border border-snow/7 bg-graphite/60" />
                <span className="relative flex size-full items-center justify-center rounded-[10px] border border-snow/8 bg-graphite">
                    <item.icon className="size-4.25 text-snow/80" aria-hidden />
                </span>
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] leading-tight font-medium text-snow">
                    {item.label}
                </span>
                <span className="text-[12px] leading-tight text-snow/45">{item.description}</span>
            </span>
            {isTopMatch && (
                <kbd className="shrink-0 rounded-[5px] bg-snow/8 px-1.5 py-0.5 font-sans text-[11px] text-snow/60">
                    ↵
                </kbd>
            )}
        </button>
    );
}
