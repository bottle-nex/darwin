"use client";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { Input } from "@/components/ui/input";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import {
    usePlaygroundNavStore,
    type SelectedThread,
} from "@/store/playground/usePlaygroundNavStore";
import { AiFillNotification } from "react-icons/ai";
import { NotificationType, type Notification } from "@trymatcha/types";

const PANEL_WIDTH = 320;

/** Each NotificationType stores a different payload shape (see the server's action classes). */
function describe_notification(notification: Notification): {
    title: string;
    description: string;
} {
    const payload = notification.payload as Record<string, string | number>;
    switch (notification.type) {
        case NotificationType.IssueAssigned:
            return {
                title: `${payload.actorName} assigned you #${payload.issueNumber}`,
                description: String(payload.issueTitle),
            };
        case NotificationType.IssueUnassigned:
            return {
                title: `${payload.actorName} unassigned you from #${payload.issueNumber}`,
                description: String(payload.issueTitle),
            };
        case NotificationType.ChatMention:
            return {
                title: `${payload.senderName} mentioned you in #${payload.issueNumber} ${payload.issueTitle}`,
                description: String(payload.message),
            };
        case NotificationType.ProjectChatMention:
            return {
                title: `${payload.senderName} mentioned you in Project chat`,
                description: String(payload.message),
            };
        default:
            return { title: "New notification", description: "" };
    }
}

/** Where clicking a notification should land — the chat thread it came from. `null` if the payload can't place it anywhere (e.g. an older notification from before this field existed). */
function notification_target(
    notification: Notification,
): { orgSlug: string; projectSlug: string; thread: SelectedThread } | null {
    const payload = notification.payload as Record<string, string | number>;
    if (!payload.orgSlug || !payload.projectSlug) return null;
    const orgSlug = String(payload.orgSlug);
    const projectSlug = String(payload.projectSlug);

    switch (notification.type) {
        case NotificationType.IssueAssigned:
        case NotificationType.IssueUnassigned:
        case NotificationType.ChatMention:
            if (!payload.issueId) return null;
            return {
                orgSlug,
                projectSlug,
                thread: {
                    kind: "issue",
                    issueId: String(payload.issueId),
                    issueNumber: Number(payload.issueNumber),
                    issueTitle: String(payload.issueTitle),
                },
            };
        case NotificationType.ProjectChatMention:
            return { orgSlug, projectSlug, thread: { kind: "project" } };
        default:
            return null;
    }
}

export default function NotificationsPanel() {
    const { isOpen, close } = useNotificationsPanelStore();
    const [query, setQuery] = useState<string>("");
    const { data: notifications = [] } = useNotifications();
    const router = useRouter();
    const { orgSlug: currentOrgSlug, projectSlug: currentProjectSlug } = useParams<{
        orgSlug?: string;
        projectSlug?: string;
    }>();
    const openThread = usePlaygroundNavStore((s) => s.openThread);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return notifications;
        return notifications.filter((notification) => {
            const { title, description } = describe_notification(notification);
            return `${title} ${description}`.toLowerCase().includes(q);
        });
    }, [notifications, query]);

    function handle_click(notification: Notification) {
        const target = notification_target(notification);
        if (!target) return;

        close();
        if (target.orgSlug === currentOrgSlug && target.projectSlug === currentProjectSlug) {
            openThread(target.thread, target.projectSlug);
            return;
        }
        const thread_param = target.thread.kind === "project" ? "project" : target.thread.issueId;
        router.push(
            `/playground/${target.orgSlug}/${target.projectSlug}?tab=thread-detail&thread=${thread_param}`,
        );
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
                        style={{ width: PANEL_WIDTH - 8 }}
                        className="ml-2 flex h-full flex-col rounded-lg border border-white/5 bg-charcoal"
                    >
                        <div className="flex flex-col gap-3 p-3">
                            <div className="relative">
                                <HiOutlineMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search notifications"
                                    className="h-9 pl-9 text-[13px] shadow-none bg-cement"
                                />
                            </div>
                        </div>
                        {filtered.length === 0 ? (
                            <div className="flex flex-col flex-1 items-center justify-center gap-y-3 px-4 text-center text-[13px] text-neutral-500">
                                <AiFillNotification size={44} />
                                No notifications yet
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
                                {filtered.map((notification) => {
                                    const { title, description } =
                                        describe_notification(notification);
                                    const clickable = notification_target(notification) !== null;
                                    return (
                                        <button
                                            key={notification.id}
                                            type="button"
                                            disabled={!clickable}
                                            onClick={() => handle_click(notification)}
                                            className="rounded-md px-2 py-2 text-left text-[13px] transition-colors hover:bg-white/5 disabled:cursor-default disabled:hover:bg-transparent"
                                        >
                                            <p className="text-neutral-100">{title}</p>
                                            {description && (
                                                <p className="mt-0.5 line-clamp-2 text-neutral-500">
                                                    {description}
                                                </p>
                                            )}
                                            <p className="mt-1 text-[11px] text-neutral-600">
                                                {formatDistanceToNow(
                                                    new Date(notification.createdAt),
                                                    {
                                                        addSuffix: true,
                                                    },
                                                )}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
