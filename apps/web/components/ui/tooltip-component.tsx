"use client";

import * as React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TooltipComponentProps = {
    children: React.ReactNode;
    content: React.ReactNode;
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
                {content}
            </TooltipContent>
        </Tooltip>
    );
}
