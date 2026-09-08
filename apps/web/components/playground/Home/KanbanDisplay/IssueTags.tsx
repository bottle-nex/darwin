import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import TagTooltip from "@/components/playground/Home/TagsDisplay/TagTooltip";
import { cn } from "@/lib/utils";
import type { BoardTag } from "@/types/board";

type IssueTagsProps = {
    tags: BoardTag[];
    /** Cards are narrow; anything past this collapses into a `+N`. */
    max?: number;
    size?: "sm" | "md";
    className?: string;
};

export default function IssueTags({ tags, max = 2, size = "md", className }: IssueTagsProps) {
    if (!tags.length) return null;

    const shown = tags.slice(0, max);
    const hidden = tags.length - shown.length;

    return (
        <div className={cn("flex min-w-0 flex-wrap items-center gap-1", className)}>
            {shown.map((tag) => (
                <TagTooltip key={tag.id} name={tag.name} color={tag.color}>
                    <TagDisplay
                        name={tag.name}
                        color={tag.color}
                        className={cn("max-w-28", size === "sm" && "px-2 text-[11.5px]")}
                    />
                </TagTooltip>
            ))}
            {hidden > 0 && (
                <span className="shrink-0 text-[10px] font-medium text-neutral-500">+{hidden}</span>
            )}
        </div>
    );
}
