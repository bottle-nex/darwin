import { cn } from "@/lib/utils";
import IconWrapper from "@/components/ui/IconWrapper";

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
        <IconWrapper
            variant="outline"
            dotColor={color}
            className={cn("text-[12px] text-neutral-200", className)}
        >
            {name}
        </IconWrapper>
    );
}
