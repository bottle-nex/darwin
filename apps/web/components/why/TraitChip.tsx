import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";

const TINTS = {
    lavender: {
        chip: "border-[#ab9ff2]/40 bg-[#ab9ff2]/10 text-[#c7bdff]",
        icon: "bg-[#ab9ff2]/20",
    },
    green: {
        chip: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
        icon: "bg-emerald-400/20",
    },
    amber: {
        chip: "border-amber-400/40 bg-amber-400/10 text-amber-300",
        icon: "bg-amber-400/20",
    },
    sky: {
        chip: "border-sky-400/40 bg-sky-400/10 text-sky-300",
        icon: "bg-sky-400/20",
    },
} as const;

export type TraitTint = keyof typeof TINTS;

export function TraitChip({
    label,
    icon: Icon,
    tint,
}: {
    label: string;
    icon: IconType;
    tint: TraitTint;
}) {
    const styles = TINTS[tint];
    return (
        <span
            className={cn(
                "mx-1 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 align-middle",
                styles.chip,
                azeretMono.className,
            )}
        >
            <span
                className={cn("flex size-6 items-center justify-center rounded-full", styles.icon)}
            >
                <Icon className="size-3.5" />
            </span>
            <span className="text-sm uppercase tracking-wide">{label}</span>
        </span>
    );
}
