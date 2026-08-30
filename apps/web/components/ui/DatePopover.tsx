"use client";

import { CloseIcon } from "@trymatcha/ui/icons";
import { format, isValid, parse } from "date-fns";
import { type ReactNode, useState } from "react";
import type { Matcher } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar, type CalendarRange } from "@/components/ui/calendar";
import IconWrapper from "@/components/ui/IconWrapper";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DATE_SHORTCUTS } from "@/lib/dateShortcuts";

import { Input } from "./input";

const INPUT_FORMAT = "dd/MM/yyyy";

/** Tighter than the standalone calendar: this one sits under a field and pills. */
const COMPACT_CALENDAR = {
    months: "flex flex-col gap-2",
    month: "flex flex-col gap-2",
    month_caption: "flex h-7 items-center pl-0.5",
    caption_label: "text-[12.5px] font-medium text-neutral-200",
    nav: "absolute top-0 right-0 flex items-center gap-0.5",
    month_grid: "w-full border-collapse",
    weekdays: "flex",
    // Columns share the width evenly so the grid ends flush with the panel
    // instead of leaving a gutter on the right.
    weekday: "flex-1 text-[11px] font-normal text-neutral-600",
    week: "flex",
    // The cell sets the grid rhythm; the button is the smaller circle inside it.
    day: "relative h-10 flex-1 p-0 text-center text-[12.5px] first:rounded-l-full last:rounded-r-full",
    day_button:
        "mx-auto flex size-8 cursor-pointer items-center justify-center rounded-full font-normal text-neutral-200 transition-colors hover:bg-snow/10",
};

export type DatePopoverProps = {
    value?: Date;
    onChange?: (value: Date | undefined) => void;
    /** Names what is being set, e.g. "Target date". Shown above the field. */
    title?: string;
    range?: CalendarRange;
    earliest?: Date;
    latest?: Date;
    /** The trigger. Gets `asChild`, so it must forward its ref and props. */
    children: ReactNode;
};

function DatePickerPanel({
    value,
    onChange,
    title,
    range,
    earliest,
    latest,
    onPicked,
}: Omit<DatePopoverProps, "children"> & { onPicked: () => void }) {
    // Only held while someone is typing, so an outside change to `value` shows
    // through without an effect syncing the two.
    const [draft, setDraft] = useState<string | null>(null);

    const outOfBounds: Matcher[] = [];
    if (earliest) outOfBounds.push({ before: earliest });
    if (latest) outOfBounds.push({ after: latest });

    const display = draft ?? (value ? format(value, INPUT_FORMAT) : "");

    function commit(next: Date | undefined) {
        onChange?.(next);
        setDraft(null);
    }

    function handleTyping(text: string) {
        setDraft(text);
        if (!text.trim()) return;
        const parsed = parse(text, INPUT_FORMAT, new Date());
        if (isValid(parsed)) onChange?.(parsed);
    }

    return (
        <div className="flex w-80 flex-col">
            <div className="flex flex-col gap-2 px-2.5 pt-2.5 pb-3">
                {title && (
                    <span className="px-0.5 text-[11px] font-medium text-neutral-500">{title}</span>
                )}

                <div className="relative">
                    <Input
                        value={display}
                        onChange={(event) => handleTyping(event.target.value)}
                        onBlur={() => setDraft(null)}
                        className="h-9! ring ring-snow/10"
                        placeholder={INPUT_FORMAT.toUpperCase()}
                        aria-label={title ?? "Date"}
                    />
                    {value && (
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label={`Clear ${title ?? "date"}`}
                            onClick={() => commit(undefined)}
                            className="absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer rounded-full"
                        >
                            <IconWrapper icon={CloseIcon} variant="ghost" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-x-1">
                    {DATE_SHORTCUTS.map((shortcut) => (
                        <Button
                            key={shortcut.label}
                            variant="unstyled"
                            type="button"
                            onClick={() => {
                                const iso = shortcut.resolve();
                                commit(iso ? new Date(iso) : undefined);
                                onPicked();
                            }}
                            className="w-fit cursor-pointer rounded-full"
                        >
                            <IconWrapper className="h-6" variant="ring">
                                {shortcut.label}
                            </IconWrapper>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="border-t border-white/6 px-2.5 py-2">
                <Calendar
                    mode="single"
                    weekStartsOn={1}
                    selected={value}
                    onSelect={(next) => {
                        commit(next);
                        onPicked();
                    }}
                    defaultMonth={value ?? range?.from ?? range?.to}
                    range={range}
                    disabled={outOfBounds}
                    className="p-0"
                    classNames={COMPACT_CALENDAR}
                />
            </div>
        </div>
    );
}

/**
 * Picking a date: type it, jump to it with a shortcut, or click it on the calendar.
 * A shortcut or a day closes the popover; typing and clearing leave it open so you
 * can keep correcting.
 */
export default function DatePopover({ children, ...panel }: DatePopoverProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <DatePickerPanel {...panel} onPicked={() => setOpen(false)} />
            </PopoverContent>
        </Popover>
    );
}
