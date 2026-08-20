"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HiOutlineInbox, HiXMark } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { PANE_TOP_BAR_HEIGHT } from "@/components/playground/Core/components/PlaygroundPaneFrame";
import { BLURRED_BG_PANEL } from "@/components/playground/Home/KanbanDisplay/cardStyles";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useMarkNotificationsRead, useNotifications } from "@/hooks/notifications/useNotifications";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import NotificationList from "./NotificationList";
import NotificationSearch from "./NotificationSearch";
import { useSelectNotification } from "./useSelectNotification";

const PANEL_WIDTH = 352;
const PANEL_GUTTER = 6;

export default function NotificationsPanel() {
    const { isOpen, close } = useNotificationsPanelStore();
    const [query, setQuery] = useState<string>("");
    const { data } = useNotifications();
    const notifications = useMemo(() => data?.notifications ?? [], [data]);
    const unreadCount = data?.unreadCount ?? 0;
    const { mutate: mark_read } = useMarkNotificationsRead();
    const select = useSelectNotification();
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const glass = useUserConfig().backgroundLightingEnabled;

    function openInbox() {
        setTab(PlaygroundTab.Inbox);
        close();
    }

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
                        style={{ width: PANEL_WIDTH - PANEL_GUTTER, marginLeft: PANEL_GUTTER }}
                        className={cn(
                            "relative flex h-full flex-col rounded-lg border-[1.5px] border-snow/5",
                            BLURRED_BG_PANEL(glass),
                        )}
                    >
                        <header
                            style={{ height: PANE_TOP_BAR_HEIGHT }}
                            className="flex shrink-0 items-center gap-2 border-b border-border pr-1.5 pl-3"
                        >
                            <h2 className="text-[14px] font-medium text-neutral-100">
                                Notifications
                            </h2>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-white/7 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300 tabular-nums">
                                    {unreadCount}
                                </span>
                            )}
                            <div className="ml-auto flex items-center gap-0.5">
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => mark_read({})}
                                        className="cursor-pointer rounded-md px-1.5 py-1 text-[11px] text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={close}
                                    aria-label="Close notifications"
                                    className="flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
                                >
                                    <HiXMark className="size-4" aria-hidden />
                                </button>
                            </div>
                        </header>

                        <div className="shrink-0 p-2">
                            <NotificationSearch value={query} onChange={setQuery} />
                        </div>

                        <NotificationList
                            notifications={notifications}
                            query={query}
                            clickableRows="navigable"
                            emptyTitle={query.trim() ? "No matches" : "You're all caught up"}
                            emptySubtitle={
                                query.trim()
                                    ? `Nothing matches “${query.trim()}”.`
                                    : "Assignments and mentions will show up here."
                            }
                            headerClassName={
                                glass ? "bg-charcoal/70 backdrop-blur-sm" : "bg-charcoal"
                            }
                            onSelect={select}
                        />

                        <footer className="shrink-0 border-t border-border p-1.5">
                            <button
                                type="button"
                                onClick={openInbox}
                                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-neutral-300 transition-colors hover:bg-white/5 hover:text-neutral-100"
                            >
                                <HiOutlineInbox className="size-3.5" aria-hidden />
                                Open inbox
                            </button>
                        </footer>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
