"use client";
import * as React from "react";
import { HiOutlineBell } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";

export default function NotificationsBellButton({
    className,
    onClick,
    ...props
}: React.ComponentProps<"button">) {
    const isOpen = useNotificationsPanelStore((s) => s.isOpen);
    const toggle = useNotificationsPanelStore((s) => s.toggle);

    return (
        <button
            {...props}
            type="button"
            onClick={(event) => {
                onClick?.(event);
                toggle();
            }}
            aria-label="Toggle notifications"
            aria-pressed={isOpen}
            className={cn(
                "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100",
                isOpen && "bg-white/5 text-neutral-100",
                className,
            )}
        >
            <HiOutlineBell className="size-4" aria-hidden />
        </button>
    );
}
