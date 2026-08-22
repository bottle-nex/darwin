import { cn } from "@/lib/utils";

type TagDisplayProps = {
    name: string;
    color: string;
    className?: string;
};

export default function TagDisplay({ name, color, className }: TagDisplayProps) {
    return (
        <span
            className={cn(
                "inline-flex h-5 max-w-full items-center gap-1.5 rounded-full px-2 text-[12px] leading-5 text-neutral-200 ring-[0.5px] ring-white/10",
                className,
            )}
        >
            <span
                style={{ backgroundColor: color }}
                className="size-2 shrink-0 rounded-full"
                aria-hidden
            />
            <span className="truncate">{name}</span>
        </span>
    );
}
