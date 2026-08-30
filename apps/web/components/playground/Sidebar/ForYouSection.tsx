"use client";
import { ChatsNavIcon, InboxIcon, MyIssuesIcon, SettingsIcon } from "@trymatcha/ui/icons";

import { useNotificationBadges } from "@/hooks/notifications/useNotificationBadges";

import { PlaygroundTab } from "../playgroundTabs";
import { type SidebarSectionProps } from "./shared";
import Row from "./SidebarRow";

// Everything waiting on you personally, as opposed to the board at large.
const FOR_YOU_ROWS: { id: string; label: string; icon: React.ComponentType }[] = [
    { id: PlaygroundTab.Inbox, label: "Inbox", icon: InboxIcon },
    {
        id: PlaygroundTab.AssignedToMe,
        label: "My issues",
        icon: MyIssuesIcon,
    },
    { id: PlaygroundTab.Chats, label: "Chats", icon: ChatsNavIcon },
    { id: PlaygroundTab.SettingsAppearance, label: "Settings", icon: SettingsIcon },
];

export default function PlaygroundSidebarForYouSection({
    selectedRowId,
    onSelect,
}: SidebarSectionProps) {
    const { inboxUnread } = useNotificationBadges();

    return (
        <section className="flex flex-col">
            {FOR_YOU_ROWS.map((r) => (
                <Row
                    key={r.id}
                    label={r.label}
                    leading={{ kind: "icon", icon: r.icon }}
                    badge={
                        r.id === PlaygroundTab.Inbox && inboxUnread > 0 ? inboxUnread : undefined
                    }
                    active={selectedRowId === r.id}
                    onClick={() => onSelect(r.id)}
                />
            ))}
        </section>
    );
}
