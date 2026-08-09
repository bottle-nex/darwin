"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HiXMark } from "react-icons/hi2";
import PlaygroundAvatar, {
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { useFloatNotificationsStore } from "@/store/playground/useFloatNotificationsStore";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import type { Notification } from "@trymatcha/types";
import { notification_target, notification_view, theme_of } from "./notificationView";
import { useSelectNotification } from "./useSelectNotification";

const VISIBLE_MS = 7500;
const EASE = [0.22, 1, 0.36, 1] as const;

export default function FloatNotifications() {
    const items = useFloatNotificationsStore((s) => s.items);
    const clear = useFloatNotificationsStore((s) => s.clear);
    const isPanelOpen = useNotificationsPanelStore((s) => s.isOpen);
    const select = useSelectNotification();

    useEffect(() => {
        if (isPanelOpen) clear();
    }, [isPanelOpen, clear]);

    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed top-12 right-2 z-50 flex w-86 flex-col gap-x-2"
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {items.map((notification) => (
                    <FloatNotificationCard
                        key={notification.id}
                        notification={notification}
                        onSelect={select}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

type FloatNotificationCardProps = {
    notification: Notification;
    onSelect: (notification: Notification) => void;
};

function FloatNotificationCard({ notification, onSelect }: FloatNotificationCardProps) {
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
            className="group pointer-events-auto relative overflow-hidden rounded-xl border border-graphite bg-graphite backdrop-blur-lg shadow-lg"
        >
            {clickable && (
                <button
                    type="button"
                    aria-label={`${actorName} ${action}`}
                    onClick={() => {
                        onSelect(notification);
                        dismiss(id);
                    }}
                    className="absolute inset-0 cursor-pointer transition-colors duration-150 hover:bg-white/4 focus-visible:bg-white/4 focus-visible:outline-none"
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
                    <span className="truncate text-[12.5px] text-neutral-400">
                        <span className="font-medium text-neutral-100">{actorName}</span> {action}
                    </span>

                    {body && (
                        <span className="mt-1 line-clamp-2 text-[12.5px] leading-[1.45] text-neutral-500">
                            {body}
                        </span>
                    )}

                    {(issueRef || projectSlug) && (
                        <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-600">
                            {issueRef && (
                                <span className="truncate font-medium text-neutral-500">
                                    {issueRef}
                                </span>
                            )}
                            {issueRef && projectSlug && (
                                <span
                                    className="size-0.5 shrink-0 rounded-full bg-white/25"
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
                className="absolute top-2 right-2 flex size-5 cursor-pointer items-center justify-center rounded-md text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/6 hover:text-neutral-200 focus-visible:opacity-100 focus-visible:outline-none"
            >
                <HiXMark className="size-3" aria-hidden />
            </button>
        </motion.div>
    );
}
