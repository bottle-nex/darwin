"use client";

import * as React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import KeyCombo from "@/components/ui/KeyCombo";

type TooltipComponentProps = {
    children: React.ReactNode;
    content: React.ReactNode;
    /** Rendered after the content as bordered key chips, e.g. `["N", "P"]`. */
    shortcut?: string[];
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

    return (
        <Tooltip delayDuration={delayDuration}>
            <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
            <TooltipContent side={side} align={align} sideOffset={sideOffset} className={className}>
                <span className="flex items-center gap-1.5">
                    {content}
                    {shortcut && shortcut.length > 0 && (
                        <KeyCombo keys={shortcut} className="min-w-4 px-1 py-0 text-[10px]" />
                    )}
                </span>
            </TooltipContent>
        </Tooltip>
    );
}
