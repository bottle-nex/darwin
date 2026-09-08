"use client";
import { CheckIcon } from "@trydarwin/ui/icons";
import { type ReactNode, useState } from "react";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types/kanban";

import { CapsuleTrigger } from "./Capsule";
import { PRIORITY_OPTIONS } from "./issueHelpers";

export default function PriorityCapsule({
    value,
    onChange,
    disabled,
    className,
    trigger,
}: {
    value?: Priority;
    onChange?: (value: Priority) => void;
    disabled?: boolean;
    className?: string;
    trigger?: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    const current = PRIORITY_OPTIONS.find((option) => option.value === value);
    const CurrentIcon = current?.icon;

    function handleSelect(next: Priority) {
        onChange?.(next);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger ?? (
                    <CapsuleTrigger disabled={disabled} className={className}>
                        {CurrentIcon && (
                            <CurrentIcon
                                className={cn(
                                    "size-3.5! ml-0.5 text-white/60",
                                    current?.iconClassName,
                                )}
                            />
                        )}
                        {current?.label ?? "Priority"}
                    </CapsuleTrigger>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0">
                <Command>
                    <CommandList>
                        <CommandEmpty>No results.</CommandEmpty>
                        <CommandGroup>
                            {PRIORITY_OPTIONS.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                    <option.icon
                                        className={cn(
                                            "size-4 text-neutral-400",
                                            option.iconClassName,
                                        )}
                                    />
                                    <span className="flex-1">{option.label}</span>
                                    {option.value === value && (
                                        <CheckIcon className="size-4 text-neutral-200" />
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
