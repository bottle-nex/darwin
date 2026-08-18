"use client";

import { Button } from "@/components/ui/button";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { MENU_SURFACE } from "@/components/ui/menuSurface";
import type { TimestampMode } from "./timestamp";

export const DATE_TIME_SEGMENTS = ["day", "month", "year", "hour", "minute", "mode"] as const;

export type DateTimeSegment = (typeof DATE_TIME_SEGMENTS)[number];

export interface DateTimeDraft {
    date: Date;
    mode: TimestampMode;
}

const MODE_ORDER: TimestampMode[] = ["datetime", "date", "time"];
const MODE_LABEL: Record<TimestampMode, string> = {
    datetime: "Date & time",
    date: "Date only",
    time: "Time only",
};
const MONTH_LABELS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

export function stepDateTime(draft: DateTimeDraft, segment: DateTimeSegment, step: number) {
    if (segment === "mode") {
        const next =
            (MODE_ORDER.indexOf(draft.mode) + step + MODE_ORDER.length) % MODE_ORDER.length;
        return { ...draft, mode: MODE_ORDER[next] };
    }

    const date = new Date(draft.date);
    if (segment === "day") date.setDate(date.getDate() + step);
    if (segment === "month") date.setMonth(date.getMonth() + step);
    if (segment === "year") date.setFullYear(date.getFullYear() + step);
    if (segment === "hour") date.setHours(date.getHours() + step);
    if (segment === "minute") date.setMinutes(date.getMinutes() + step);
    return { ...draft, date };
}

function segmentLabel(draft: DateTimeDraft, segment: DateTimeSegment) {
    const { date } = draft;
    if (segment === "day") return String(date.getDate()).padStart(2, "0");
    if (segment === "month") return MONTH_LABELS[date.getMonth()];
    if (segment === "year") return String(date.getFullYear());
    if (segment === "hour") return String(date.getHours()).padStart(2, "0");
    if (segment === "minute") return String(date.getMinutes()).padStart(2, "0");
    return MODE_LABEL[draft.mode];
}

interface DateTimePickerProps {
    draft: DateTimeDraft;
    segment: DateTimeSegment;
    confirmLabel?: string;
    onSegment: (segment: DateTimeSegment) => void;
    onStep: (segment: DateTimeSegment, step: number) => void;
    onInsert: () => void;
}

export default function DateTimePicker({
    draft,
    segment,
    confirmLabel = "Insert",
    onSegment,
    onStep,
    onInsert,
}: DateTimePickerProps) {
    return (
        <div className={cn(MENU_SURFACE, "pointer-events-auto flex flex-col gap-2 p-2")}>
            <div className="flex items-end gap-1">
                {DATE_TIME_SEGMENTS.filter((name) => name !== "mode").map((name) => (
                    <div key={name} className="flex flex-col items-center gap-0.5">
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label={`Increase ${name}`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => onStep(name, 1)}
                            className="cursor-pointer rounded-[3px] px-1 text-neutral-500 hover:bg-white/10 hover:text-neutral-200"
                        >
                            <LuChevronUp className="size-3" />
                        </Button>
                        <Button
                            variant="unstyled"
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => onSegment(name)}
                            className={cn(
                                "min-w-10 cursor-pointer rounded-[4px] px-1.5 py-0.5 text-center font-mono text-[13px] transition-colors",
                                segment === name
                                    ? "bg-primary/30 text-neutral-100"
                                    : "text-neutral-300 hover:bg-white/5",
                            )}
                        >
                            {segmentLabel(draft, name)}
                        </Button>
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label={`Decrease ${name}`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => onStep(name, -1)}
                            className="cursor-pointer rounded-[3px] px-1 text-neutral-500 hover:bg-white/10 hover:text-neutral-200"
                        >
                            <LuChevronDown className="size-3" />
                        </Button>
                    </div>
                ))}
            </div>

            <Button
                variant="unstyled"
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onStep("mode", 1)}
                className={cn(
                    "cursor-pointer rounded-[4px] px-1.5 py-0.5 text-[12px] transition-colors",
                    segment === "mode"
                        ? "bg-primary/30 text-neutral-100"
                        : "text-neutral-400 hover:bg-white/5",
                )}
            >
                {MODE_LABEL[draft.mode]}
            </Button>

            <Button
                variant="unstyled"
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={onInsert}
                className="cursor-pointer rounded-[5px] bg-white/10 px-2 py-1 text-[12px] text-neutral-100 transition-colors hover:bg-white/20"
            >
                {confirmLabel}
            </Button>
        </div>
    );
}
