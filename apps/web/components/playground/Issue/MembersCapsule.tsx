"use client";

import { AssigneeGroupIcon } from "@trymatcha/ui/icons";
import { useState } from "react";

import MemberOptionRow from "@/components/playground/Core/components/MemberOptionRow";
import ProjectRoleTicker from "@/components/playground/Team/TeamView/ProjectRoleTicker";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";

import { CapsuleTrigger } from "./Capsule";

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
            <AssigneeGroupIcon className="size-3.5! text-snow" />
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
                                        <MemberOptionRow
                                            id={member.id}
                                            label={member.name ?? member.email}
                                            avatarSrc={member.image}
                                            avatarSize="lg"
                                            checked={isSelected}
                                            secondaryLabel={member.name ? member.email : undefined}
                                            trailing={
                                                <ProjectRoleTicker role={member.role} size="sm" />
                                            }
                                        />
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
