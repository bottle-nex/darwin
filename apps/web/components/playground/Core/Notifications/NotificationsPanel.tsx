"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HiOutlineBell, HiOutlineMagnifyingGlass, HiXMark } from "react-icons/hi2";
import { Input } from "@/components/ui/input";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/notifications/useNotifications";
import NotificationRow from "./NotificationRow";
import { group_by_day, notification_target, notification_view } from "./notificationView";
import { useSelectNotification } from "./useSelectNotification";

const PANEL_WIDTH = 352;

export default function NotificationsPanel() {
    const { isOpen, close } = useNotificationsPanelStore();
    const [query, setQuery] = useState<string>("");
    const { data } = useNotifications();
    const notifications = useMemo(() => data?.notifications ?? [], [data]);
    const unreadCount = data?.unreadCount ?? 0;
    const { mutate: mark_read } = useMarkNotificationsRead();
    const select = useSelectNotification();

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const matched = !q
            ? notifications
            : notifications.filter((notification) => {
                  const { actorName, action, body, issueRef, projectSlug } =
                      notification_view(notification);
                  return `${actorName} ${action} ${body} ${issueRef ?? ""} ${projectSlug ?? ""}`
                      .toLowerCase()
                      .includes(q);
              });
        return group_by_day(matched);
    }, [notifications, query]);

    const isEmpty = groups.length === 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.aside
                    aria-label="Notifications"
                    initial={{ width: 0 }}
                    animate={{ width: PANEL_WIDTH }}
                    exit={{ width: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full min-h-0 shrink-0 overflow-hidden"
                >
                    <div
                        style={{ width: PANEL_WIDTH - 8 }}
                        className="ml-2 flex h-full flex-col rounded-lg border border-white/5 bg-charcoal"
                    >
                        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-white/5 pr-1.5 pl-3">
                            <h2 className="text-[14px] font-medium text-neutral-200">
                                Notifications
                            </h2>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-white/6 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 tabular-nums">
                                    {unreadCount}
                                </span>
                            )}
                            <div className="ml-auto flex items-center gap-0.5">
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => mark_read({})}
                                        className="cursor-pointer rounded-md px-1.5 py-1 text-[11px] text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={close}
                                    aria-label="Close notifications"
                                    className="flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-100"
                                >
                                    <HiXMark className="size-4" aria-hidden />
                                </button>
                            </div>
                        </header>

                        <div className="shrink-0 p-2">
                            <div className="relative">
                                <HiOutlineMagnifyingGlass
                                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-500"
                                    aria-hidden
                                />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search notifications"
                                    className="h-8 rounded-md bg-cement pr-8 pl-8 text-[12.5px] shadow-none hover:bg-graphite"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery("")}
                                        aria-label="Clear search"
                                        className="absolute top-1/2 right-2 flex size-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-neutral-400 transition-colors hover:bg-white/20 hover:text-neutral-100"
                                    >
                                        <HiXMark className="size-2.5" aria-hidden />
                                    </button>
                                )}
                            </div>
                        </div>

                        {isEmpty ? (
                            <EmptyState query={query.trim()} />
                        ) : (
                            <div className="flex-1 overflow-y-auto overscroll-contain px-1.5 pb-2">
                                {groups.map((group) => (
                                    <section key={group.label} className="">
                                        <h3 className="sticky top-0 z-10 bg-charcoal/95 px-2 py-1.5 text-[10px] font-medium tracking-[0.08em] text-neutral-600 uppercase backdrop-blur-sm">
                                            {group.label}
                                        </h3>
                                        {group.items.map((notification) => (
                                            <NotificationRow
                                                key={notification.id}
                                                notification={notification}
                                                clickable={
                                                    notification_target(notification) !== null
                                                }
                                                onSelect={() => select(notification)}
                                            />
                                        ))}
                                    </section>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}

function EmptyState({ query }: { query: string }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
            <span
                className="flex size-11 items-center justify-center rounded-xl bg-cement text-neutral-500 ring-1 ring-white/10"
                aria-hidden
            >
                <HiOutlineBell className="size-5" />
            </span>
            <p className="mt-3 text-[13px] font-medium text-neutral-300">
                {query ? "No matches" : "You're all caught up"}
            </p>
            <p className="mt-1 text-[12px] text-neutral-500">
                {query
                    ? `Nothing matches “${query}”.`
                    : "Assignments and mentions will show up here."}
            </p>
        </div>
    );
}
