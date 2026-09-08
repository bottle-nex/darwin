import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type BentoCardProps = {
    lit: boolean;
    litDelay: number;
    label: string;
    description: string;
    diagram: ReactNode;
    /** Set false to let the diagram escape the card frame (the diagram must clip itself). */
    clip?: boolean;
};

export default function BentoCard({
    lit,
    litDelay,
    label,
    description,
    diagram,
    clip = true,
}: BentoCardProps) {
    return (
        <div
            style={{ "--lit-delay": `${litDelay}ms` } as CSSProperties}
            className={cn(
                "group lit-edge relative flex h-64 flex-col rounded-[10px] border border-edge bg-linear-to-b from-graphite to-cement p-5 shadow-[0_10px_30px_-18px_rgba(24,24,27,0.28)] md:h-96 md:p-6",
                clip && "overflow-hidden",
                lit && "is-lit",
            )}
        >
            <div className="min-h-0 flex-1">{diagram}</div>
            <div className="relative mt-auto pt-4">
                <div className="flex items-center gap-2">
                    <span className="size-1 bg-muted-foreground" />
                    <span className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                        {label}
                    </span>
                </div>
                <p className="mt-3 max-w-[24ch] text-sm leading-snug text-foreground/70 md:text-[15px]">
                    {description}
                </p>
            </div>
        </div>
    );
}
