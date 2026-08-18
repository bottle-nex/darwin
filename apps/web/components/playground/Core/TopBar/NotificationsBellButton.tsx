"use client";
import * as React from "react";
import { HiOutlineBell } from "react-icons/hi2";
import IconWrapper from "@/components/ui/IconWrapper";
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
            className={cn("group relative flex shrink-0 cursor-pointer rounded-full", className)}
        >
            <IconWrapper icon={HiOutlineBell} active={isOpen} variant="ghost" />
            {unreadCount > 0 && (
                <span
                    className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-snow px-1 text-[9px] leading-none font-medium tabular-nums"
                    aria-hidden
                >
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </button>
    );
}
