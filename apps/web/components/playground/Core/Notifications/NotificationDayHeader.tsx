"use client";
import { cn } from "@/lib/utils";

export default function NotificationDayHeader({
    label,
    className,
}: {
    label: string;
    className: string;
}) {
    return (
        <h3
            className={cn(
                "px-2 py-1.5 text-[10px] font-medium tracking-[0.08em] text-neutral-500 uppercase",
                className,
            )}
        >
            {label}
        </h3>
    );
}
