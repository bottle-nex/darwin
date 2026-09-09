"use client";
import { type Notification, NotificationScope } from "@trydarwin/types";
import { CloseIcon } from "@trydarwin/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { BLURRED_BG_TWO } from "@/components/playground/Home/KanbanDisplay/cardStyles";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { cn } from "@/lib/utils";
import { useCommandContextStore } from "@/store/command/useCommandContextStore";
import { useFloatNotificationsStore } from "@/store/playground/useFloatNotificationsStore";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

import { notification_target, notification_view, theme_of } from "./notificationView";
import { useSelectNotification } from "./useSelectNotification";

const VISIBLE_MS = 7500;
const EASE = [0.22, 1, 0.36, 1] as const;

export default function FloatNotifications() {
    const items = useFloatNotificationsStore((s) => s.items);
    const clearScope = useFloatNotificationsStore((s) => s.clearScope);
    const isPanelOpen = useNotificationsPanelStore((s) => s.isOpen);
    const activeTab = usePlaygroundNavStore((s) => s.tab);
    const activeProjectId = useCommandContextStore((s) => s.projectId);
    const select = useSelectNotification();
    const glass = useUserConfig().backgroundLightingEnabled;

    useEffect(() => {
        if (isPanelOpen) clearScope(NotificationScope.Member);
    }, [isPanelOpen, clearScope]);

    useEffect(() => {
        if (activeTab === PlaygroundTab.Inbox) {
            clearScope(NotificationScope.Project, activeProjectId);
        }
    }, [activeTab, activeProjectId, clearScope]);

    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed top-12 right-2 z-50 flex w-86 flex-col gap-x-2 gap-y-2"
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {items.map((notification) => (
                    <FloatNotificationCard
                        key={notification.id}
                        notification={notification}
                        glass={glass}
                        onSelect={select}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

type FloatNotificationCardProps = {
    notification: Notification;
    glass: boolean;
    onSelect: (notification: Notification) => void;
};

function FloatNotificationCard({ notification, glass, onSelect }: FloatNotificationCardProps) {
    const dismiss = useFloatNotificationsStore((s) => s.dismiss);
    const [paused, setPaused] = useState<boolean>(false);
    const reduceMotion = useReducedMotion();
    const id = notification.id;

    useEffect(() => {
        if (paused) return;
        const timer = setTimeout(() => dismiss(id), VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [id, paused, dismiss]);

    const { actorId, actorName, action, body, issueRef, projectSlug } =
        notification_view(notification);
    const { icon: Icon, tint } = theme_of(notification);
    const clickable = notification_target(notification) !== null;

    return (
        <motion.div
            layout
            initial={reduceMotion ? false : { x: "110%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? {} : { x: "110%" }}
            transition={{ duration: reduceMotion ? 0 : 0.34, ease: EASE }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            className={cn(
                "group pointer-events-auto relative overflow-hidden rounded-xl gradient-border before:z-10 shadow-[var(--shadow-menu)]",
                BLURRED_BG_TWO(glass),
            )}
        >
            {clickable && (
                <button
                    type="button"
                    aria-label={`${actorName} ${action}`}
                    onClick={() => {
                        onSelect(notification);
                        dismiss(id);
                    }}
                    className="absolute inset-0 cursor-pointer transition-colors duration-150 hover:bg-overlay/4 focus-visible:bg-overlay/4 focus-visible:outline-none"
                />
            )}

            <div className="pointer-events-none relative flex items-start gap-2.5 p-3 pr-8">
                <span className="relative mt-px shrink-0">
                    <PlaygroundAvatar
                        letter={actorName[0]?.toUpperCase() ?? "?"}
                        tone={toneFor(actorId || notification.id)}
                        size="lg"
                    />
                    <span
                        className={`absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-charcoal ring-2 ring-charcoal ${tint}`}
                        aria-hidden
                    >
                        <Icon className="size-2.5" />
                    </span>
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[12.5px] text-neutral-300">
                        <span className="font-medium text-neutral-100">{actorName}</span> {action}
                    </span>

                    {body && (
                        <span className="mt-1 line-clamp-2 text-[12.5px] leading-[1.45] text-neutral-400">
                            {body}
                        </span>
                    )}

                    {(issueRef || projectSlug) && (
                        <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
                            {issueRef && (
                                <span className="truncate font-medium text-neutral-400">
                                    {issueRef}
                                </span>
                            )}
                            {issueRef && projectSlug && (
                                <span
                                    className="size-0.5 shrink-0 rounded-full bg-overlay/20"
                                    aria-hidden
                                />
                            )}
                            {projectSlug && <span className="shrink-0">{projectSlug}</span>}
                        </span>
                    )}
                </span>
            </div>

            <button
                type="button"
                onClick={() => dismiss(id)}
                aria-label="Dismiss notification"
                className="absolute top-2 right-2 flex size-5 cursor-pointer items-center justify-center rounded-md text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-overlay/7 hover:text-neutral-100 focus-visible:opacity-100 focus-visible:outline-none"
            >
                <CloseIcon className="size-3" aria-hidden />
            </button>
        </motion.div>
    );
}
