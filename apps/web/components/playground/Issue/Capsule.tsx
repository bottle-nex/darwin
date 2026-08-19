"use client";

import { Button } from "@/components/ui/button";
import { forwardRef, useState } from "react";
import type { IconType } from "react-icons";
import { format } from "date-fns";
import { MdCheck } from "react-icons/md";
import { HiCalendar } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export interface CapsuleOption {
    value: string;
    label: string;
    dotClassName?: string;
}

export const CapsuleTrigger = forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
    function CapsuleTrigger({ className, children, ...props }, ref) {
        return (
            <Button
                variant="unstyled"
                type="button"
                ref={ref}
                className={cn(
                    "flex w-fit! items-center gap-1.5 px-2! py-1! bg-white/5 ring ring-white/10 text-[13px]! font-medium text-white/55 rounded-full! cursor-pointer hover:bg-white/10 transition-colors",
                    className,
                )}
                {...props}
            >
                {children}
            </Button>
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
                    <Button
                        variant="unstyled"
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
                    </Button>
                );
            })}
        </div>
    );
}

interface CapsuleDropdownProps {
    type: "dropdown";
    options: CapsuleOption[];
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

function CapsuleDropdown({ options, value, onChange, disabled, className }: CapsuleDropdownProps) {
    const [open, setOpen] = useState(false);
    const selected = options.find((option) => option.value === value) ?? options[0];

    function handleSelect(next: string) {
        onChange?.(next);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <CapsuleTrigger disabled={disabled} className={className}>
                    {selected?.dotClassName && (
                        <span className={cn("size-2 rounded-full", selected.dotClassName)} />
                    )}
                    {selected?.label}
                </CapsuleTrigger>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1">
                <CapsuleOptionList options={options} value={value} onSelect={handleSelect} />
            </PopoverContent>
        </Popover>
    );
}

interface CapsuleCalendarProps {
    type: "calendar";
    value?: Date;
    onChange?: (value: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    icon?: IconType;
    iconClassName?: string;
}

function CapsuleCalendar({
    value,
    onChange,
    placeholder = "Set date",
    disabled,
    className,
    icon: Icon = HiCalendar,
    iconClassName = "text-white/60",
}: CapsuleCalendarProps) {
    const [open, setOpen] = useState(false);

    function handleSelect(next: Date | undefined) {
        onChange?.(next);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <CapsuleTrigger disabled={disabled} className={className}>
                    <Icon className={cn("size-3.5", iconClassName)} />
                    {value ? format(value, "MMM d, yyyy") : placeholder}
                </CapsuleTrigger>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={value} onSelect={handleSelect} />
            </PopoverContent>
        </Popover>
    );
}

export type CapsuleProps = CapsuleDropdownProps | CapsuleCalendarProps;

export default function Capsule(props: CapsuleProps) {
    switch (props.type) {
        case "calendar":
            return <CapsuleCalendar {...props} />;
        case "dropdown":
            return <CapsuleDropdown {...props} />;
    }
}
