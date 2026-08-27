"use client";

import { AddIcon, CheckIcon, LoadingSpinnerIcon, TagIcon } from "@trymatcha/ui/icons";
import { useState } from "react";

import TagDisplay from "@/components/playground/Home/TagsDisplay/TagDisplay";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateTag } from "@/hooks/tags/useCreateTag";
import { useListTags } from "@/hooks/tags/useListTags";
import { TAG_COLORS } from "@/types/tags";

import { CapsuleTrigger } from "./Capsule";

interface TagsCapsuleProps {
    projectId: string | undefined;
    value?: string[];
    onChange?: (tagIds: string[]) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}

export default function TagsCapsule({
    projectId,
    value,
    onChange,
    disabled,
    className,
    placeholder = "Tags",
}: TagsCapsuleProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const selected = value ?? [];
    const { data: tags } = useListTags(projectId);
    const createTag = useCreateTag();

    function toggle(id: string) {
        const next = selected.includes(id)
            ? selected.filter((tagId) => tagId !== id)
            : [...selected, id];
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
                    onChange?.([...selected, tag.id]);
                    setSearch("");
                },
            },
        );
    }

    const selectedTags = allTags.filter((tag) => selected.includes(tag.id));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <CapsuleTrigger disabled={disabled} className={className}>
                    {selectedTags.length === 0 ? (
                        <>
                            <TagIcon className="size-3.5 text-white/60" />
                            {placeholder}
                        </>
                    ) : (
                        <>
                            <span className="flex items-center -space-x-1">
                                {selectedTags.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="size-2.5 rounded-full ring-2 ring-charcoal"
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
            <PopoverContent className="w-40 p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        border={false}
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
                                        className="hover:bg-transparent! active:bg-transparent! focus:bg-transparent!"
                                        onSelect={() => toggle(tag.id)}
                                    >
                                        <TagDisplay
                                            name={tag.name}
                                            color={tag.color}
                                            className="flex-1"
                                        />
                                        {isSelected && (
                                            <CheckIcon className="size-4 shrink-0 text-neutral-400" />
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
                                    {createTag.isPending ? (
                                        <LoadingSpinnerIcon className="size-4 shrink-0 animate-spin text-neutral-400" />
                                    ) : (
                                        <AddIcon className="size-4 shrink-0 text-neutral-400" />
                                    )}
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
