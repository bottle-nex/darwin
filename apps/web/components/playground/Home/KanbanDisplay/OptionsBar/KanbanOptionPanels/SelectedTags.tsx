"use client";
import { MdClose } from "react-icons/md";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useListTags } from "@/hooks/tags/useListTags";
import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";

type SelectedTagsProps = {
    /** Tag ids currently applied to the board filter. */
    selected: string[];
    onRemove: (id: string) => void;
};

/** Chips for the currently-applied tag filters, each removable. */
export default function SelectedTags({ selected, onRemove }: SelectedTagsProps) {
    const projectId = useActiveProject()?.id;
    const { data: allTags } = useListTags(projectId);
    if (selected.length === 0) return null;

    return (
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {selected.map((id) => {
                const tag = allTags?.find((t) => t.id === id);
                if (!tag) return null;
                return (
                    <span key={id} className="inline-flex shrink-0 items-center gap-1">
                        <TagDisplay name={tag.name} color={tag.color} />
                        <button
                            type="button"
                            onClick={() => onRemove(id)}
                            aria-label={`Remove ${tag.name} filter`}
                            className="cursor-pointer text-neutral-400 opacity-70 hover:opacity-100"
                        >
                            <MdClose className="size-2.5" aria-hidden />
                        </button>
                    </span>
                );
            })}
        </div>
    );
}
