"use client";

import { useState } from "react";
import { MdAdd, MdCheck, MdLabel } from "react-icons/md";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useListTags } from "@/hooks/tags/useListTags";
import { useCreateTag } from "@/hooks/tags/useCreateTag";
import { TAG_COLORS } from "@/types/tags";
import TagDisplay from "@/components/playground/Home/panes/tags/TagDisplay";
import { CapsuleTrigger } from "./Capsule";

interface TagsCapsuleProps {
    projectId: string | undefined;
    defaultValue?: string[];
    onChange?: (tagIds: string[]) => void;
    className?: string;
}

export default function TagsCapsule({
    projectId,
    defaultValue,
    onChange,
    className,
}: TagsCapsuleProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<string[]>(defaultValue ?? []);
    const { data: tags } = useListTags(projectId);
    const createTag = useCreateTag();

    function toggle(id: string) {
        const next = selected.includes(id)
            ? selected.filter((tagId) => tagId !== id)
            : [...selected, id];
        setSelected(next);
        onChange?.(next);
    }

    const allTags = tags ?? [];
    const query = search.trim().toLowerCase();
    const filtered = query
        ? allTags.filter((tag) => tag.name.toLowerCase().includes(query))
        : allTags;
    const exactMatch = allTags.some((tag) => tag.name.toLowerCase() === query);
    const canCreate = Boolean(projectId) && query.length > 0 && !exactMatch;

    function handleCreate() {
        if (!projectId) return;
        const name = search.trim();
        const color = TAG_COLORS[allTags.length % TAG_COLORS.length];
        createTag.mutate(
            { projectId, name, color },
            {
                onSuccess: (tag) => {
                    const next = [...selected, tag.id];
                    setSelected(next);
                    onChange?.(next);
                    setSearch("");
                },
            },
        );
    }

    const selectedTags = allTags.filter((tag) => selected.includes(tag.id));

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
                            {selectedTags.length === 1
                                ? selectedTags[0].name
                                : `${selectedTags.length} tags`}
                        </>
                    )}
                </CapsuleTrigger>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 border-white/10 bg-charcoal p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Search or create tag..."
                    />
                    <CommandList>
                        {filtered.length === 0 && !canCreate && (
                            <CommandEmpty>No tags yet</CommandEmpty>
                        )}
                        <CommandGroup>
                            {filtered.map((tag) => {
                                const isSelected = selected.includes(tag.id);
                                return (
                                    <CommandItem
                                        key={tag.id}
                                        value={tag.id}
                                        onSelect={() => toggle(tag.id)}
                                    >
                                        <TagDisplay
                                            name={tag.name}
                                            color={tag.color}
                                            className="flex-1"
                                        />
                                        {isSelected && (
                                            <MdCheck className="size-4 shrink-0 text-neutral-400" />
                                        )}
                                    </CommandItem>
                                );
                            })}
                            {canCreate && (
                                <CommandItem
                                    value={`create-${search}`}
                                    disabled={createTag.isPending}
                                    onSelect={handleCreate}
                                >
                                    <MdAdd className="size-4 shrink-0 text-neutral-400" />
                                    <span className="flex-1 truncate">
                                        Create &quot;{search.trim()}&quot;
                                    </span>
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
