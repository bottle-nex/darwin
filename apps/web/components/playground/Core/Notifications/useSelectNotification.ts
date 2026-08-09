"use client";
import { useParams, useRouter } from "next/navigation";
import { useMarkNotificationsRead } from "@/hooks/notifications/useNotifications";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import type { Notification } from "@trymatcha/types";
import { notification_target } from "./notificationView";

export function useSelectNotification() {
    const { mutate: mark_read } = useMarkNotificationsRead();
    const router = useRouter();
    const { orgSlug: currentOrgSlug, projectSlug: currentProjectSlug } = useParams<{
        orgSlug?: string;
        projectSlug?: string;
    }>();
    const openThread = usePlaygroundNavStore((s) => s.openThread);
    const close = useNotificationsPanelStore((s) => s.close);

    return function select(notification: Notification) {
        if (!notification.readAt) mark_read({ ids: [notification.id] });

        const target = notification_target(notification);
        if (!target) return;

        close();
        if (!target.thread) {
            router.push(`/playground/${target.orgSlug}/${target.projectSlug}`);
            return;
        }
        if (target.orgSlug === currentOrgSlug && target.projectSlug === currentProjectSlug) {
            openThread(target.thread, target.projectSlug);
            return;
        }
        const thread_param = target.thread.kind === "project" ? "project" : target.thread.issueId;
        router.push(
            `/playground/${target.orgSlug}/${target.projectSlug}?tab=thread-detail&thread=${thread_param}`,
        );
    };
}
