"use client";
import { NotificationsBellIcon } from "@trydarwin/ui/icons";

import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useNotificationBadges } from "@/hooks/notifications/useNotificationBadges";
import { cn } from "@/lib/utils";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";

import { SIDEBAR_ICON_BUTTON_CLASS } from "./shared";

export default function SidebarNotificationsButton() {
    const notificationsOpen = useNotificationsPanelStore((state) => state.isOpen);
    const toggleNotifications = useNotificationsPanelStore((state) => state.toggle);
    const { memberUnread } = useNotificationBadges();

    return (
        <TooltipComponent content="Notifications" side="top" delayDuration={500}>
            <Button
                variant="unstyled"
                type="button"
                onClick={toggleNotifications}
                aria-label={
                    memberUnread > 0
                        ? `Toggle notifications (${memberUnread} unread)`
                        : "Toggle notifications"
                }
                aria-pressed={notificationsOpen}
                className={cn(
                    SIDEBAR_ICON_BUTTON_CLASS,
                    notificationsOpen && "bg-white/8 text-neutral-100",
                )}
            >
                <NotificationsBellIcon className="size-3.75" aria-hidden />
                {memberUnread > 0 ? (
                    <span
                        className="absolute top-0 right-0 flex h-3 min-w-3 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] leading-none font-medium text-ink tabular-nums"
                        aria-hidden
                    >
                        {memberUnread > 9 ? "9+" : memberUnread}
                    </span>
                ) : null}
            </Button>
        </TooltipComponent>
    );
}
