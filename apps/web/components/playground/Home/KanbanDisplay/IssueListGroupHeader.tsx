"use client";

import { AddIcon, DropdownCaretIcon } from "@trydarwin/ui/icons";
import type { ReactNode } from "react";

import IconWrapper from "@/components/ui/IconWrapper";
import { cn } from "@/lib/utils";

type IssueListGroupHeaderProps = {
    title: string;
    glyph: ReactNode;
    count: number;
    total?: number;
    collapsed: boolean;
    onToggle: () => void;
    onCreate?: () => void;
};

export default function IssueListGroupHeader({
    title,
    glyph,
    count,
    total,
    collapsed,
    onToggle,
    onCreate,
}: IssueListGroupHeaderProps) {
    return (
        <div className="group/header relative h-9 rounded-lg bg-active backdrop-blur-2xl">
            <button
                type="button"
                aria-label={`${collapsed ? "Expand" : "Collapse"} ${title}`}
                aria-expanded={!collapsed}
                onClick={onToggle}
                className="absolute inset-0 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
            <div className="pointer-events-none relative flex h-full items-center gap-3 px-3">
                <DropdownCaretIcon
                    className={cn(
                        "size-4 shrink-0 text-neutral-500 transition-all group-hover/header:text-neutral-200",
                        collapsed && "-rotate-90",
                    )}
                    aria-hidden
                />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    {glyph}
                    <span className="truncate text-[13px] font-semibold text-neutral-200">
                        {title}
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-neutral-500 tabular-nums">
                        {count}
                        {total !== undefined && total !== count && (
                            <span className="text-neutral-600"> / {total}</span>
                        )}
                    </span>
                </div>
                {onCreate && (
                    <button
                        type="button"
                        aria-label={`Add an issue to ${title}`}
                        onClick={onCreate}
                        className="pointer-events-auto shrink-0 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        <IconWrapper icon={AddIcon} variant="ghost" />
                    </button>
                )}
            </div>
        </div>
    );
}
