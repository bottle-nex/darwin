"use client";

import * as React from "react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

type InfoTooltipProps = {
    children: React.ReactNode;
    content: React.ReactNode;
    side?: React.ComponentProps<typeof HoverCardContent>["side"];
    align?: React.ComponentProps<typeof HoverCardContent>["align"];
    sideOffset?: number;
    openDelay?: number;
    closeDelay?: number;
    className?: string;
};

export default function InfoTooltip({
    children,
    content,
    side = "top",
    align = "start",
    sideOffset,
    openDelay = 250,
    closeDelay = 100,
    className,
}: InfoTooltipProps) {
    if (content === null || content === undefined || content === "") {
        return <>{children}</>;
    }

    return (
        <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
            <HoverCardTrigger asChild>{children}</HoverCardTrigger>
            <HoverCardContent
                side={side}
                align={align}
                sideOffset={sideOffset}
                className={cn("max-w-50 rounded-md! min-w-0 p-2 px-3", className)}
            >
                {content}
            </HoverCardContent>
        </HoverCard>
    );
}
