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
                "group lit-edge relative flex h-64 flex-col rounded-[10px] bg-linear-to-b from-charcoal to-ink p-5 md:h-96 md:p-6",
                clip && "overflow-hidden",
                lit && "is-lit",
            )}
        >
            <div className="min-h-0 flex-1">{diagram}</div>
            <div className="relative mt-auto pt-4">
                <div className="flex items-center gap-2">
                    <span className="size-1 bg-neutral-400" />
                    <span className="text-[10px] tracking-[0.25em] text-neutral-400 uppercase">
                        {label}
                    </span>
                </div>
                <p className="mt-3 max-w-[24ch] text-sm leading-snug text-snow/40 md:text-[15px]">
                    {description}
                </p>
            </div>
        </div>
    );
}
