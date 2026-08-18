"use client";

import * as React from "react";
import { HoverCard as HoverCardPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { MENU_ALIGN, MENU_SIDE_OFFSET, MENU_SURFACE } from "./menuSurface";

function HoverCard({ ...props }: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
    return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger({ ...props }: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
    return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

function HoverCardContent({
    className,
    align = MENU_ALIGN,
    sideOffset = MENU_SIDE_OFFSET,
    ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
    return (
        <HoverCardPrimitive.Portal>
            <HoverCardPrimitive.Content
                data-slot="hover-card-content"
                align={align}
                sideOffset={sideOffset}
                className={cn(
                    MENU_SURFACE,
                    "origin-(--radix-hover-card-content-transform-origin) outline-none",
                    className,
                )}
                {...props}
            />
        </HoverCardPrimitive.Portal>
    );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
