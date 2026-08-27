"use client";

import { CalendarNavNextIcon, CalendarNavPrevIcon } from "@trymatcha/ui/icons";
import { addDays, isBefore, startOfDay } from "date-fns";
import * as React from "react";
import { type ChevronProps, DayPicker, type Matcher } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RANGE_TRACK = "bg-snow/5";
const RANGE_EDGE = "[&>button]:bg-snow/90 [&>button]:text-neutral-900 [&>button]:hover:bg-snow/90";

export interface CalendarRange {
    from?: Date;
    to?: Date;
}

function rangeModifiers(range?: CalendarRange): Record<string, Matcher> | undefined {
    if (!range?.from || !range.to) return undefined;
    const from = startOfDay(range.from);
    const to = startOfDay(range.to);
    if (!isBefore(from, to)) return undefined;
    const middle: Date[] = [];
    for (let day = addDays(from, 1); isBefore(day, to); day = addDays(day, 1)) {
        middle.push(day);
    }
    return { range_start: from, range_middle: middle, range_end: to };
}

function Chevron({ orientation }: ChevronProps) {
    return orientation === "left" ? (
        <CalendarNavPrevIcon className="size-4" />
    ) : (
        <CalendarNavNextIcon className="size-4" />
    );
}

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    range,
    modifiers,
    ...props
}: React.ComponentProps<typeof DayPicker> & { range?: CalendarRange }) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("relative p-4", className)}
            modifiers={{ ...rangeModifiers(range), ...modifiers }}
            classNames={{
                months: "flex flex-col gap-4",
                month: "flex flex-col gap-4",
                month_caption: "flex justify-center pt-1 relative items-center w-full",
                caption_label: "text-sm font-medium text-neutral-100",
                nav: "flex items-center justify-between absolute inset-x-4 top-4",
                button_previous: cn(
                    buttonVariants({ variant: "ghost" }),
                    "size-7 p-0 text-neutral-400 hover:text-neutral-100",
                ),
                button_next: cn(
                    buttonVariants({ variant: "ghost" }),
                    "size-7 p-0 text-neutral-400 hover:text-neutral-100",
                ),
                month_grid: "w-max border-collapse",
                weekdays: "flex",
                weekday: "text-neutral-500 w-8 font-normal text-[0.75rem]",
                week: "flex mt-1",
                day: "size-8 p-0 text-center text-sm relative first:rounded-l-full last:rounded-r-full",
                day_button: cn(
                    "size-8 rounded-full p-0 font-normal text-neutral-200 transition-colors cursor-pointer",
                    "hover:bg-snow/10 aria-selected:opacity-100",
                ),
                range_middle: RANGE_TRACK,
                range_start: cn(RANGE_TRACK, "rounded-l-full", RANGE_EDGE),
                range_end: cn(RANGE_TRACK, "rounded-r-full", RANGE_EDGE),
                selected: RANGE_EDGE,
                today: "[&>button]:ring [&>button]:ring-snow/20",
                outside: "text-neutral-600",
                disabled: "text-neutral-700 opacity-50",
                hidden: "invisible",
                ...classNames,
            }}
            components={{ Chevron }}
            {...props}
        />
    );
}

export { Calendar };
