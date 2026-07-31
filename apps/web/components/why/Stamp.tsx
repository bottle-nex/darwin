import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";

export function Stamp({
    label,
    rotate = 0,
    accent = false,
    className,
}: {
    label: string;
    rotate?: number;
    accent?: boolean;
    className?: string;
}) {
    return (
        <span
            style={{ transform: `rotate(${rotate}deg)` }}
            className={cn(
                "inline-flex border px-2.5 py-1 text-[10px] uppercase tracking-widest",
                "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
                accent ? "border-primary/50 text-primary" : "border-white/25 text-neutral-400",
                azeretMono.className,
                className,
            )}
        >
            {label}
        </span>
    );
}
