"use client";
import * as React from "react";
import { HiOutlineBell } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { useNotifications } from "@/hooks/notifications/useNotifications";

export default function NotificationsBellButton({
    className,
    onClick,
    ...props
}: React.ComponentProps<"button">) {
    const isOpen = useNotificationsPanelStore((s) => s.isOpen);
    const toggle = useNotificationsPanelStore((s) => s.toggle);
    const { data } = useNotifications();
    const unreadCount = data?.unreadCount ?? 0;

    return (
        <button
            {...props}
            type="button"
            onClick={(event) => {
                onClick?.(event);
                toggle();
            }}
            aria-label={
                unreadCount > 0
                    ? `Toggle notifications (${unreadCount} unread)`
                    : "Toggle notifications"
            }
            aria-pressed={isOpen}
            className={cn(
                "relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100",
                isOpen && "bg-white/5 text-neutral-100",
                className,
            )}
        >
            <HiOutlineBell className="size-4 text-snow" aria-hidden />
            {unreadCount > 0 && (
                <span
                    className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-snow px-1 text-[9px] leading-none font-medium tabular-nums ring-2 ring-charcoal"
                    aria-hidden
                >
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </button>
    );
}
