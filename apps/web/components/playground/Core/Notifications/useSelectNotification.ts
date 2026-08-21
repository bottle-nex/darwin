"use client";
import { useParams, useRouter } from "next/navigation";
import { useMarkNotificationsRead } from "@/hooks/notifications/useNotifications";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useIssueNavigation } from "@/components/playground/Issue/useIssueNavigation";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { useChatThreadStore } from "@/store/playground/useChatThreadStore";
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
    const selectProjectChat = useChatThreadStore((s) => s.selectProject);
    const selectTeamChat = useChatThreadStore((s) => s.selectTeam);
    const { openIssue } = useIssueNavigation();
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
            const teamId = target.destination.teamId;
            if (teamId) selectTeamChat(teamId);
            else selectProjectChat();

            if (isCurrentProject) {
                const params = new URLSearchParams(window.location.search);
                params.set("tab", PlaygroundTab.Chats);
                if (teamId) params.set("teamChat", teamId);
                else params.delete("teamChat");
                window.history.replaceState(null, "", `${base}?${params.toString()}`);
                setTab(PlaygroundTab.Chats);
            } else {
                const params = new URLSearchParams({ tab: PlaygroundTab.Chats });
                if (teamId) params.set("teamChat", teamId);
                router.push(`${base}?${params.toString()}`);
            }
            return;
        }

        if (isCurrentProject) openIssue(target.destination.issueId);
        else router.push(`${base}/issue/${target.destination.issueId}`);
    };
}
