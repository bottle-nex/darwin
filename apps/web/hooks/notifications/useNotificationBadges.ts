"use client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useInboxFeed } from "./useInboxFeed";
import { useMemberNotifications } from "./useMemberNotifications";

export function useNotificationBadges() {
    const projectId = useActiveProject()?.id;
    const inbox = useInboxFeed(projectId);
    const member = useMemberNotifications();

    return { inboxUnread: inbox.unreadCount, memberUnread: member.unreadCount };
}
