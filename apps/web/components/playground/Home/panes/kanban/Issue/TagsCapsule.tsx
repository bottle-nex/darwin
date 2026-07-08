"use client";

import { useState } from "react";
import { MdCheck, MdLabel } from "react-icons/md";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useListTags } from "@/hooks/tags/useListTags";
import TagDisplay from "@/components/playground/Home/panes/tags/TagDisplay";
import { CapsuleTrigger } from "./Capsule";

interface TagsCapsuleProps {
    projectId: string | undefined;
    defaultValue?: string[];
    onChange?: (tagIds: string[]) => void;
    className?: string;
}

export default function TagsCapsule({ projectId, defaultValue, onChange, className }: TagsCapsuleProps) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>(defaultValue ?? []);
    const { data: tags, isLoading } = useListTags(projectId);

    function toggle(id: string) {
        const next = selected.includes(id)
            ? selected.filter((tagId) => tagId !== id)
            : [...selected, id];
        setSelected(next);
        onChange?.(next);
    }

    const selectedTags = (tags ?? []).filter((tag) => selected.includes(tag.id));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <CapsuleTrigger className={className}>
                    {selectedTags.length === 0 ? (
                        <>
                            <MdLabel className="size-3.5 text-white/60" />
                            Tags
                        </>
                    ) : (
                        <>
                            <span className="flex items-center -space-x-1">
                                {selectedTags.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="size-2.5 rounded-full ring-2 ring-[#1a1a1b]"
                                        style={{ backgroundColor: tag.color }}
                                    />
                                ))}
                            </span>
                            {selectedTags.length === 1 ? selectedTags[0].name : `${selectedTags.length} tags`}
                        </>
                    )}
                </CapsuleTrigger>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 border-white/10 bg-charcoal p-1">
                <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                    {isLoading && (
                        <p className="px-2 py-1.5 text-[12px] text-neutral-500">Loading...</p>
                    )}
                    {!isLoading && !tags?.length && (
                        <p className="px-2 py-1.5 text-[12px] text-neutral-500">No tags yet</p>
                    )}
                    {tags?.map((tag) => {
                        const isSelected = selected.includes(tag.id);
                        return (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggle(tag.id)}
                                className={cn(
                                    "flex items-center justify-between gap-2 rounded-md px-1 py-1 text-left transition-colors cursor-pointer",
                                    isSelected ? "bg-white/8" : "hover:bg-white/5",
                                )}
                            >
                                <TagDisplay name={tag.name} color={tag.color} />
                                {isSelected && (
                                    <MdCheck className="size-4 shrink-0 text-neutral-400" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
