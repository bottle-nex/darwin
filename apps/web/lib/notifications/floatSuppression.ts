import { NotificationScope, notification_scope, type Notification } from "@trymatcha/types";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";

export function should_float_notification(
    notification: Notification,
    panelOpen: boolean,
    activeTab: string,
    activeProjectId: string | null,
): boolean {
    if (notification_scope(notification.type) === NotificationScope.Member) return !panelOpen;
    return !(activeTab === PlaygroundTab.Inbox && notification.projectId === activeProjectId);
}
