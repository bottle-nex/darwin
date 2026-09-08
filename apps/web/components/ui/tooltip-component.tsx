"use client";

import * as React from "react";

import KeyCombo from "@/components/ui/KeyCombo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type TooltipComponentProps = {
    children: React.ReactNode;
    content: React.ReactNode;
    /** Rendered after the content as bordered key chips, e.g. `["N", "P"]`. */
    shortcut?: string[];
    foot?: React.ReactNode;
    side?: React.ComponentProps<typeof TooltipContent>["side"];
    align?: React.ComponentProps<typeof TooltipContent>["align"];
    sideOffset?: number;
    delayDuration?: number;
    asChild?: boolean;
    className?: string;
};

export function TooltipComponent({
    children,
    content,
    shortcut,
    foot,
    side = "top",
    align = "center",
    sideOffset = 4,
    delayDuration,
    asChild = true,
    className,
}: TooltipComponentProps) {
    if (content === null || content === undefined || content === "") {
        return <>{children}</>;
    }

    const chips = shortcut?.length ? <KeyCombo keys={shortcut} /> : null;

    return (
        <Tooltip delayDuration={delayDuration}>
            <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
            <TooltipContent
                side={side}
                align={align}
                sideOffset={sideOffset}
                className={cn(
                    foot ? "min-w-44 max-w-72 rounded-lg p-0 text-xs" : chips && "py-1",
                    className,
                )}
            >
                {foot ? (
                    <>
                        <div className="px-2.5 py-2 text-snow/90">{content}</div>
                        <div className="flex items-center justify-between gap-4 border-t border-white/6 px-2.5 py-1.5 text-[11px] text-snow/50">
                            {foot}
                            {chips}
                        </div>
                    </>
                ) : (
                    <span className="flex items-center gap-1.5">
                        {content}
                        {chips}
                    </span>
                )}
            </TooltipContent>
        </Tooltip>
    );
}
