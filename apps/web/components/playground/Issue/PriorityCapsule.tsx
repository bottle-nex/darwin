"use client";
import { useState } from "react";
import { MdCheck } from "react-icons/md";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import type { Priority } from "@/types/kanban";
import { CapsuleTrigger } from "./Capsule";
import { PRIORITY_OPTIONS } from "./issueHelpers";

export default function PriorityCapsule({
    defaultValue,
    onChange,
    disabled,
    className,
}: {
    defaultValue?: Priority;
    onChange?: (value: Priority) => void;
    disabled?: boolean;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Priority>(defaultValue ?? "medium");

    const current = PRIORITY_OPTIONS.find((option) => option.value === selected);
    const CurrentIcon = current?.icon;

    function handleSelect(value: Priority) {
        setSelected(value);
        onChange?.(value);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <CapsuleTrigger disabled={disabled} className={className}>
                    {CurrentIcon && <CurrentIcon className="size-3.5 text-white/60" />}
                    {current?.label ?? "Priority"}
                </CapsuleTrigger>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0">
                <Command>
                    <CommandInput
                        icon={false}
                        border={false}
                        placeholder="Change priority to..."
                        trailing={
                            <span className="shrink-0 rounded bg-cement px-1.5 py-0.5 text-[11px] leading-none font-medium text-neutral-500">
                                P
                            </span>
                        }
                    />
                    <CommandList>
                        <CommandEmpty>No results.</CommandEmpty>
                        <CommandGroup>
                            {PRIORITY_OPTIONS.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                    <option.icon className="size-4 text-neutral-400" />
                                    <span className="flex-1">{option.label}</span>
                                    {option.value === selected && (
                                        <MdCheck className="size-4 text-neutral-200" />
                                    )}
                                    <span className="w-3 text-right text-[12px] text-neutral-500">
                                        {option.rank}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
