import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type BentoCardProps = {
    lit: boolean;
    litDelay: number;
};

export default function BentoCard({ lit, litDelay }: BentoCardProps) {
    return (
        <div
            style={{ "--lit-delay": `${litDelay}ms` } as CSSProperties}
            className={cn(
                "lit-edge relative h-64 rounded-[10px] bg-linear-to-b from-charcoal to-ink md:h-96",
                lit && "is-lit",
            )}
        />
    );
}
