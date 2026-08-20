"use client";
import { useParams, useRouter } from "next/navigation";
import { useMarkNotificationsRead } from "@/hooks/notifications/useNotifications";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useIssueRoute } from "@/components/playground/Issue/useIssueRoute";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import type { Notification } from "@trymatcha/types";
import { notification_target } from "./notificationView";

export function useSelectNotification() {
    const { mutate: mark_read } = useMarkNotificationsRead();
    const router = useRouter();
    const { orgSlug: currentOrgSlug, projectSlug: currentProjectSlug } = useParams<{
        orgSlug?: string;
        projectSlug?: string;
    }>();
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const { openIssue } = useIssueRoute();
    const close = useNotificationsPanelStore((s) => s.close);

    return function select(notification: Notification) {
        if (!notification.readAt) mark_read({ ids: [notification.id] });

        const target = notification_target(notification);
        if (!target) return;

        close();
        const base = `/playground/${target.orgSlug}/${target.projectSlug}`;
        if (!target.destination) {
            router.push(base);
            return;
        }

        const isCurrentProject =
            target.orgSlug === currentOrgSlug && target.projectSlug === currentProjectSlug;

        if (target.destination.kind === "chats") {
            if (isCurrentProject) setTab(PlaygroundTab.Chats);
            else router.push(`${base}?tab=${PlaygroundTab.Chats}`);
            return;
        }

        if (isCurrentProject) openIssue(target.destination.issueId);
        else router.push(`${base}/issue/${target.destination.issueId}`);
    };
}
