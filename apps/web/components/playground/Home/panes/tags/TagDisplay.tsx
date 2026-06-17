import { cn } from "@/lib/utils";

type TagDisplayProps = {
    name: string;
    color: string;
    className?: string;
};

/**
 * A small rounded pill showing a colored dot and the tag name. Presentational
 * only and dependency-free so it can be reused on issues later.
 */
export default function TagDisplay({ name, color, className }: TagDisplayProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] text-neutral-200",
                className,
            )}
            style={{ backgroundColor: `${color}1a`, borderColor: `${color}40` }}
        >
            <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
            />
            <span className="truncate">{name}</span>
        </span>
    );
}
