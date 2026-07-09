"use client";

import { forwardRef, useState } from "react";
import { format } from "date-fns";
import { MdCheck, MdCalendarMonth } from "react-icons/md";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

export interface CapsuleOption {
    value: string;
    label: string;
    dotClassName?: string;
}

export const CapsuleTrigger = forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
    function CapsuleTrigger({ className, children, ...props }, ref) {
        return (
            <button
                type="button"
                ref={ref}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1 bg-white/5 ring ring-white/10 text-xs text-white/55 rounded-xl cursor-pointer hover:bg-white/10 transition-colors",
                    className,
                )}
                {...props}
            >
                {children}
            </button>
        );
    },
);

interface CapsuleOptionListProps {
    options: CapsuleOption[];
    value?: string;
    onSelect: (value: string) => void;
}

function CapsuleOptionList({ options, value, onSelect }: CapsuleOptionListProps) {
    return (
        <div className="flex flex-col gap-0.5">
            {options.map((option) => {
                const isSelected = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onSelect(option.value)}
                        className={cn(
                            "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-neutral-200 transition-colors cursor-pointer",
                            isSelected ? "bg-white/8" : "hover:bg-white/5",
                        )}
                    >
                        <span className="flex items-center gap-2">
                            {option.dotClassName && (
                                <span className={cn("size-2 rounded-full", option.dotClassName)} />
                            )}
                            {option.label}
                        </span>
                        {isSelected && <MdCheck className="size-4 shrink-0 text-neutral-400" />}
                    </button>
                );
            })}
        </div>
    );
}

interface CapsuleDropdownProps {
    type: "dropdown";
    options: CapsuleOption[];
    defaultValue?: string;
    onChange?: (value: string) => void;
    className?: string;
}

function CapsuleDropdown({ options, defaultValue, onChange, className }: CapsuleDropdownProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(defaultValue ?? options[0]?.value);
    const selected = options.find((option) => option.value === value) ?? options[0];

    function handleSelect(next: string) {
        setValue(next);
        onChange?.(next);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <CapsuleTrigger className={className}>
                    {selected?.dotClassName && (
                        <span className={cn("size-2 rounded-full", selected.dotClassName)} />
                    )}
                    {selected?.label}
                </CapsuleTrigger>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-44 border-white/10 bg-charcoal p-1">
                <CapsuleOptionList options={options} value={value} onSelect={handleSelect} />
            </PopoverContent>
        </Popover>
    );
}

interface CapsuleDropdownSearchProps {
    type: "dropdown-search";
    options: CapsuleOption[];
    defaultValue?: string;
    onChange?: (value: string) => void;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
}

function CapsuleDropdownSearch({
    options,
    defaultValue,
    onChange,
    searchPlaceholder = "Search...",
    emptyText = "No results.",
    className,
}: CapsuleDropdownSearchProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(defaultValue ?? options[0]?.value);
    const selected = options.find((option) => option.value === value) ?? options[0];

    function handleSelect(next: string) {
        setValue(next);
        onChange?.(next);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <CapsuleTrigger className={className}>
                    {selected?.dotClassName && (
                        <span className={cn("size-2 rounded-full", selected.dotClassName)} />
                    )}
                    {selected?.label}
                </CapsuleTrigger>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 border-white/10 bg-charcoal p-0">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                    {option.dotClassName && (
                                        <span
                                            className={cn(
                                                "size-2 rounded-full",
                                                option.dotClassName,
                                            )}
                                        />
                                    )}
                                    <span className="flex-1">{option.label}</span>
                                    {option.value === value && (
                                        <MdCheck className="size-4 shrink-0 text-neutral-400" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface CapsuleCalendarProps {
    type: "calendar";
    defaultValue?: Date;
    onChange?: (value: Date | undefined) => void;
    placeholder?: string;
    className?: string;
}

function CapsuleCalendar({
    defaultValue,
    onChange,
    placeholder = "Set date",
    className,
}: CapsuleCalendarProps) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(defaultValue);

    function handleSelect(next: Date | undefined) {
        setDate(next);
        onChange?.(next);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <CapsuleTrigger className={className}>
                    <MdCalendarMonth className="size-3.5 text-white/60" />
                    {date ? format(date, "MMM d, yyyy") : placeholder}
                </CapsuleTrigger>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto border-white/10 p-0 bg-charcoal">
                <Calendar mode="single" selected={date} onSelect={handleSelect} />
            </PopoverContent>
        </Popover>
    );
}

export type CapsuleProps = CapsuleDropdownProps | CapsuleDropdownSearchProps | CapsuleCalendarProps;

export default function Capsule(props: CapsuleProps) {
    switch (props.type) {
        case "calendar":
            return <CapsuleCalendar {...props} />;
        case "dropdown-search":
            return <CapsuleDropdownSearch {...props} />;
        case "dropdown":
            return <CapsuleDropdown {...props} />;
    }
}
