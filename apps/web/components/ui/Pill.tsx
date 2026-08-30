import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PillTone = "neutral" | "muted" | "brand" | "positive" | "faint";
type PillSize = "sm" | "md";

const TONE: Record<PillTone, string> = {
    neutral: "text-neutral-200 ring-white/10",
    muted: "text-snow/50 ring-white/10",
    brand: "text-primary ring-primary/30",
    positive: "text-green-500 ring-green-500/30",
    faint: "text-snow/45 ring-white/12",
};

const SIZE: Record<PillSize, string> = {
    sm: "px-1.5 text-[10px] leading-[1.5]",
    md: "h-5 px-2 text-[12px] leading-5",
};

/** A small rounded label. `dotColor` prepends a coloured dot, the way a tag reads. */
export default function Pill({
    tone = "neutral",
    size = "md",
    dotColor,
    children,
    className,
}: {
    tone?: PillTone;
    size?: PillSize;
    dotColor?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full ring-[0.5px]",
                TONE[tone],
                SIZE[size],
                className,
            )}
        >
            {dotColor && (
                <span
                    style={{ backgroundColor: dotColor }}
                    className="size-2 shrink-0 rounded-full"
                    aria-hidden
                />
            )}
            {children}
        </span>
    );
}
