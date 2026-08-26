"use client";
import { motion } from "motion/react";
import type { IconType } from "react-icons";

import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
    value: T;
    label: string;
    icon: IconType;
    disabledReason?: string;
}

export default function SegmentedControl<T extends string>({
    name,
    label,
    value,
    options,
    onChange,
    showLabels = true,
}: {
    name: string;
    label: string;
    value: T;
    options: SegmentedOption<T>[];
    onChange: (value: T) => void;
    showLabels?: boolean;
}) {
    return (
        <div role="tablist" aria-label={label} className="flex items-center gap-1">
            {options.map((option) => (
                <Segment
                    key={option.value}
                    name={name}
                    option={option}
                    selected={option.value === value}
                    showLabel={showLabels}
                    onSelect={() => onChange(option.value)}
                />
            ))}
        </div>
    );
}

function Segment<T extends string>({
    name,
    option,
    selected,
    showLabel,
    onSelect,
}: {
    name: string;
    option: SegmentedOption<T>;
    selected: boolean;
    showLabel: boolean;
    onSelect: () => void;
}) {
    const disabled = Boolean(option.disabledReason);
    // Without a label the icon has to carry the meaning on its own, so the name it would have shown
    // moves to the tooltip and to assistive technology rather than being dropped.
    const hint = option.disabledReason ?? (showLabel ? null : option.label);

    const segment = (
        <Button
            variant="unstyled"
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={showLabel ? undefined : option.label}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={onSelect}
            className={cn(
                "relative flex cursor-pointer items-center gap-1.5 rounded-full text-[13.5px] font-medium transition-colors",
                showLabel ? "px-2.5 py-1" : "p-1.5",
                selected ? "text-snow" : "text-neutral-500 hover:text-neutral-300",
                disabled && "cursor-not-allowed text-neutral-600 hover:text-neutral-600",
            )}
        >
            {selected && (
                <motion.span
                    layoutId={`${name}-segment`}
                    className="absolute inset-0 rounded-full border border-snow/5 bg-snow/4 shadow-sm shadow-black/7"
                    transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
                />
            )}
            <option.icon className="relative size-3.5" aria-hidden />
            {showLabel && <span className="relative">{option.label}</span>}
        </Button>
    );

    if (!hint) return segment;

    return (
        <TooltipComponent content={hint} side="top">
            <span className="inline-flex">{segment}</span>
        </TooltipComponent>
    );
}
