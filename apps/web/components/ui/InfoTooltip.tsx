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
                className={cn(
                    "min-w-0 max-w-64 rounded-xl",
                    typeof content === "string" ? "px-4 py-3" : "px-3 py-2",
                    className,
                )}
            >
                {typeof content === "string" ? (
                    <p className="text-[13px] leading-relaxed text-overlay/90">{content}</p>
                ) : (
                    content
                )}
            </HoverCardContent>
        </HoverCard>
    );
}
