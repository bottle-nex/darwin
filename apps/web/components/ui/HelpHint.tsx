"use client";
import { HelpIcon } from "@trymatcha/ui/icons";
import type { ReactNode } from "react";

import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";

/** The question-mark a reader hovers for an explanation. One spelling, everywhere. */
export default function HelpHint({
    content,
    label,
    side = "right",
    contentClassName,
    className,
}: {
    content: ReactNode;
    label: string;
    side?: "top" | "right" | "bottom" | "left";
    contentClassName?: string;
    className?: string;
}) {
    return (
        <InfoTooltip side={side} className={contentClassName} content={content}>
            <span
                tabIndex={0}
                aria-label={label}
                className={cn(
                    "flex shrink-0 cursor-help items-center justify-center rounded-md text-snow/25 outline-none transition-colors hover:text-snow/60 focus-visible:text-snow/60",
                    className,
                )}
            >
                <HelpIcon className="size-3.5" aria-hidden />
            </span>
        </InfoTooltip>
    );
}
