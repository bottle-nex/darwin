"use client";

import { CheckIcon } from "@trymatcha/ui/icons";
import { useRef, useState } from "react";

import PlaygroundAvatar, {
    initialOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import ProjectRoleTicker from "@/components/playground/Team/TeamView/ProjectRoleTicker";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { cn } from "@/lib/utils";

type ProjectTeamMemberPickerProps = {
    projectId: string;
    excludedUserIds: string[];
    selectedUserIds: string[];
    onChange: (userIds: string[]) => void;
    maxSelections: number;
};

export default function ProjectTeamMemberPicker({
    projectId,
    excludedUserIds,
    selectedUserIds,
    onChange,
    maxSelections,
}: ProjectTeamMemberPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const searchFieldRef = useRef<HTMLDivElement>(null);
    const { data: members, isLoading, isError } = useProjectMembers(projectId);
    const excluded = new Set(excludedUserIds);
    const availableMembers = members?.filter((member) => !excluded.has(member.id)) ?? [];

    function toggle(userId: string) {
        if (selectedUserIds.includes(userId)) {
            onChange(selectedUserIds.filter((selectedId) => selectedId !== userId));
        } else if (selectedUserIds.length < maxSelections) {
            onChange([...selectedUserIds, userId]);
        }
    }

    function handleOpenChange(open: boolean) {
        setIsOpen(open);
        if (!open) setSearch("");
    }

    return (
        <div className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-medium text-neutral-300">Add from project</span>
                {selectedUserIds.length > 0 && (
                    <span className="text-[11px] text-neutral-500">
                        {selectedUserIds.length} selected
                    </span>
                )}
            </div>
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
                <Command className="h-auto overflow-visible rounded-none bg-transparent">
                    <PopoverAnchor asChild>
                        <div
                            ref={searchFieldRef}
                            onClick={() => setIsOpen(true)}
                            className="rounded-xl border border-white/8 bg-black/10"
                        >
                            <CommandInput
                                value={search}
                                onValueChange={setSearch}
                                onFocus={() => setIsOpen(true)}
                                border={false}
                                placeholder="Search project members..."
                                className="text-[12px]"
                            />
                        </div>
                    </PopoverAnchor>
                    <PopoverContent
                        align="start"
                        sideOffset={4}
                        onOpenAutoFocus={(event) => event.preventDefault()}
                        onCloseAutoFocus={(event) => event.preventDefault()}
                        onInteractOutside={(event) => {
                            if (searchFieldRef.current?.contains(event.target as Node)) {
                                event.preventDefault();
                            }
                        }}
                        className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
                    >
                        <CommandList className="max-h-56 p-1">
                            {isLoading ? (
                                <p className="px-3 py-5 text-center text-[12px] text-neutral-500">
                                    Loading project members…
                                </p>
                            ) : isError ? (
                                <p className="px-3 py-5 text-center text-[12px] text-rose-400">
                                    Couldn&apos;t load project members.
                                </p>
                            ) : (
                                <>
                                    <CommandEmpty>
                                        {availableMembers.length === 0
                                            ? "Everyone in this project is already on the team."
                                            : "No project members found."}
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {availableMembers.map((member) => {
                                            const selected = selectedUserIds.includes(member.id);
                                            const disabled =
                                                !selected &&
                                                selectedUserIds.length >= maxSelections;

                                            return (
                                                <CommandItem
                                                    key={member.id}
                                                    value={`${member.name ?? ""} ${member.email}`}
                                                    disabled={disabled}
                                                    onSelect={() => toggle(member.id)}
                                                    className={cn(selected && "bg-white/5")}
                                                >
                                                    <PlaygroundAvatar
                                                        letter={initialOf(
                                                            member.name,
                                                            member.email,
                                                        )}
                                                        src={member.image}
                                                        tone={toneFor(member.id)}
                                                        size="lg"
                                                    />
                                                    <span className="flex min-w-0 flex-1 flex-col">
                                                        <span className="truncate text-[12px] font-medium text-neutral-100">
                                                            {member.name ?? member.email}
                                                        </span>
                                                        {member.name && (
                                                            <span className="truncate text-[10px] text-neutral-500">
                                                                {member.email}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <ProjectRoleTicker
                                                        role={member.role}
                                                        size="sm"
                                                    />
                                                    <CheckIcon
                                                        className={cn(
                                                            "size-4 shrink-0 text-primary",
                                                            !selected && "invisible",
                                                        )}
                                                        aria-hidden
                                                    />
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </PopoverContent>
                </Command>
            </Popover>
        </div>
    );
}
