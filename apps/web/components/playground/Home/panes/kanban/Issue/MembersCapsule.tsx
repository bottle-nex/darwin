"use client";

import { useState } from "react";
import { MdCheck, MdPeople } from "react-icons/md";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { CapsuleTrigger } from "./Capsule";

interface MembersCapsuleProps {
    projectId: string | undefined;
    defaultValue?: string[];
    onChange?: (memberIds: string[]) => void;
    className?: string;
}

export default function MembersCapsule({
    projectId,
    defaultValue,
    onChange,
    className,
}: MembersCapsuleProps) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>(defaultValue ?? []);
    const { data: members, isLoading } = useProjectMembers(projectId);

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
            <PopoverContent align="start" className="w-56 border-white/10 bg-charcoal p-1">
                <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
                    {isLoading && (
                        <p className="px-2 py-1.5 text-[12px] text-neutral-500">Loading...</p>
                    )}
                    {!isLoading && !members?.length && (
                        <p className="px-2 py-1.5 text-[12px] text-neutral-500">No members yet</p>
                    )}
                    {members?.map((member) => {
                        const isSelected = selected.includes(member.id);
                        return (
                            <button
                                key={member.id}
                                type="button"
                                onClick={() => toggle(member.id)}
                                className={cn(
                                    "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-neutral-200 transition-colors cursor-pointer",
                                    isSelected ? "bg-white/8" : "hover:bg-white/5",
                                )}
                            >
                                <span className="truncate">{member.name ?? member.email}</span>
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
