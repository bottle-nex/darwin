import { cn } from "@/lib/utils";

type TagDisplayProps = {
    name: string;
    color: string;
    className?: string;
};

export default function TagDisplay({ name, color, className }: TagDisplayProps) {
    return (
        <span
            style={{
                color,
                backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
            }}
            className={cn(
                "inline-flex h-5 max-w-full items-center rounded-full px-2 text-[12px] leading-none",
                className,
            )}
        >
            <span className="truncate">{name}</span>
        </span>
    );
}
