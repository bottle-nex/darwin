"use client";

import * as React from "react";
import { DayPicker, type ChevronProps } from "react-day-picker";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Chevron({ orientation }: ChevronProps) {
    return orientation === "left" ? (
        <MdChevronLeft className="size-4" />
    ) : (
        <MdChevronRight className="size-4" />
    );
}

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: React.ComponentProps<typeof DayPicker>) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col gap-4",
                month: "flex flex-col gap-4",
                month_caption: "flex justify-center pt-1 relative items-center w-full",
                caption_label: "text-sm font-medium text-neutral-100",
                nav: "flex items-center justify-between absolute inset-x-0 top-0",
                button_previous: cn(
                    buttonVariants({ variant: "ghost" }),
                    "size-7 p-0 text-neutral-400 hover:text-neutral-100",
                ),
                button_next: cn(
                    buttonVariants({ variant: "ghost" }),
                    "size-7 p-0 text-neutral-400 hover:text-neutral-100",
                ),
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday: "text-neutral-500 w-8 font-normal text-[0.75rem]",
                week: "flex w-full mt-1",
                day: "size-8 p-0 text-center text-sm relative",
                day_button: cn(
                    "size-8 rounded-md p-0 font-normal text-neutral-200 transition-colors cursor-pointer",
                    "hover:bg-white/10 aria-selected:opacity-100",
                ),
                range_start: "day-range-start",
                range_end: "day-range-end",
                selected:
                    "[&>button]:bg-white/90 [&>button]:text-neutral-900 [&>button]:hover:bg-white/90",
                today: "[&>button]:ring [&>button]:ring-white/20",
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
