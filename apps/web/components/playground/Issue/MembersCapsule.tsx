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
import ProjectRoleTicker from "@/components/playground/Team/TeamView/ProjectRoleTicker";
import { CapsuleTrigger } from "./Capsule";

const MEMBER_TONES = [
    "bg-indigo-500/30 text-indigo-100",
    "bg-emerald-500/30 text-emerald-100",
    "bg-sky-500/30 text-sky-100",
    "bg-rose-500/30 text-rose-100",
    "bg-amber-500/30 text-amber-100",
    "bg-violet-500/30 text-violet-100",
];

function memberTone(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return MEMBER_TONES[hash % MEMBER_TONES.length];
}

interface MembersCapsuleProps {
    projectId: string | undefined;
    value?: string[];
    onChange?: (memberIds: string[]) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    /** The "assigning is compulsory" hint — only meaningful where that rule is enforced. */
    tooltip?: boolean;
    /** Pass both to control the popover from outside (e.g. open it on failed submit). */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
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
                memberTone(member.id),
            )}
        >
            {initial}
        </span>
    );
}

export default function MembersCapsule({
    projectId,
    value,
    onChange,
    disabled,
    className,
    placeholder = "Members",
    tooltip = true,
    open: controlledOpen,
    onOpenChange,
}: MembersCapsuleProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;
    const selected = value ?? [];
    const { data: members } = useProjectMembers(projectId);

    function toggle(id: string) {
        const next = selected.includes(id)
            ? selected.filter((memberId) => memberId !== id)
            : [...selected, id];
        onChange?.(next);
    }

    const selectedMembers = (members ?? []).filter((member) => selected.includes(member.id));
    const trigger = (
        <CapsuleTrigger disabled={disabled} className={className}>
            <MdPeople className="size-3.5 text-white/60" />
            {selectedMembers.length === 0
                ? placeholder
                : selectedMembers.length === 1
                  ? (selectedMembers[0].name ?? selectedMembers[0].email)
                  : `${selectedMembers.length} members`}
        </CapsuleTrigger>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            {tooltip ? (
                <TooltipComponent
                    className="w-60"
                    content="Assigning a member is compulsory, our agent may ask them questions about this issue."
                >
                    <PopoverTrigger asChild>{trigger}</PopoverTrigger>
                </TooltipComponent>
            ) : (
                <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            )}
            <PopoverContent className="w-72 p-0">
                <Command>
                    <CommandInput
                        border={false}
                        placeholder="Search members..."
                        className="text-xs"
                    />
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
