"use client";

import { useState } from "react";
import { MdCheck, MdPeople } from "react-icons/md";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useProjectMembers, type ProjectMember } from "@/hooks/project/useProjectMembers";
import ProjectRoleTicker from "@/components/playground/Projects/TeamView/ProjectRoleTicker";
import { toneFor } from "../customkanban/CardAvatars";
import { CapsuleTrigger } from "./Capsule";

interface MembersCapsuleProps {
    projectId: string | undefined;
    defaultValue?: string[];
    onChange?: (memberIds: string[]) => void;
    className?: string;
}

function MemberAvatar({ member }: { member: ProjectMember }) {
    const initial = (member.name?.trim()?.[0] ?? member.email[0] ?? "?").toUpperCase();

    if (member.image) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={member.image}
                alt=""
                className="size-6 shrink-0 rounded-full object-cover ring-1 ring-white/10"
            />
        );
    }

    return (
        <span
            className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                toneFor(member.id),
            )}
        >
            {initial}
        </span>
    );
}

export default function MembersCapsule({
    projectId,
    defaultValue,
    onChange,
    className,
}: MembersCapsuleProps) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>(defaultValue ?? []);
    const { data: members } = useProjectMembers(projectId);

    function toggle(id: string) {
        const next = selected.includes(id)
            ? selected.filter((memberId) => memberId !== id)
            : [...selected, id];
        setSelected(next);
        onChange?.(next);
    }

    const selectedMembers = (members ?? []).filter((member) => selected.includes(member.id));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <TooltipComponent
                className="w-60"
                content="Assigning a member is compulsory, our agent may ask them questions about this issue."
            >
                <PopoverTrigger asChild>
                    <CapsuleTrigger className={className}>
                        <MdPeople className="size-3.5 text-white/60" />
                        {selectedMembers.length === 0
                            ? "Members"
                            : selectedMembers.length === 1
                              ? (selectedMembers[0].name ?? selectedMembers[0].email)
                              : `${selectedMembers.length} members`}
                    </CapsuleTrigger>
                </PopoverTrigger>
            </TooltipComponent>
            <PopoverContent align="start" className="w-72 border-white/10 bg-charcoal p-0">
                <Command>
                    <CommandInput placeholder="Search members..." className="text-xs" />
                    <CommandList>
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup>
                            {members?.map((member) => {
                                const isSelected = selected.includes(member.id);
                                return (
                                    <CommandItem
                                        key={member.id}
                                        value={member.name ?? member.email}
                                        onSelect={() => toggle(member.id)}
                                    >
                                        <MemberAvatar member={member} />
                                        <span className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-[13px] text-neutral-100">
                                                {member.name ?? member.email}
                                            </span>
                                            {member.name && (
                                                <span className="truncate text-[11px] text-neutral-500">
                                                    {member.email}
                                                </span>
                                            )}
                                        </span>
                                        <ProjectRoleTicker role={member.role} size="sm" />
                                        {isSelected && (
                                            <MdCheck className="size-4 shrink-0 text-neutral-400" />
                                        )}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
