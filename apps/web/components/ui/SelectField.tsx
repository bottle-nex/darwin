"use client";

import { useMemo, useState } from "react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type SelectFieldOption = {
    value: string;
    label: React.ReactNode;
};

export default function SelectField({
    options,
    value,
    onChange,
    placeholder,
    size = "default",
    disabled,
    className,
    "aria-label": ariaLabel,
}: {
    options: SelectFieldOption[];
    value: string | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    size?: "sm" | "default";
    disabled?: boolean;
    className?: string;
    "aria-label"?: string;
}) {
    const [open, setOpen] = useState(false);
    const [orderedBy, setOrderedBy] = useState(value);

    function handleOpenChange(next: boolean) {
        if (next) setOrderedBy(value);
        setOpen(next);
    }

    const selectedFirst = useMemo(() => {
        const selected = options.find((option) => option.value === orderedBy);
        if (!selected) return options;
        return [selected, ...options.filter((option) => option.value !== orderedBy)];
    }, [options, orderedBy]);

    return (
        <Select
            value={value}
            onValueChange={onChange}
            open={open}
            onOpenChange={handleOpenChange}
            disabled={disabled}
        >
            <SelectTrigger size={size} className={className} aria-label={ariaLabel}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {selectedFirst.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
