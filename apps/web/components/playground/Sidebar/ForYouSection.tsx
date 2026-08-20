"use client";
import {
    HiOutlineCheckCircle,
    HiOutlineClipboardDocumentList,
    HiOutlineCog6Tooth,
    HiOutlineInbox,
} from "react-icons/hi2";
import { HiOutlineAnnotation } from "react-icons/hi";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import Row from "./SidebarRow";
import Section from "./SidebarSection";
import { type SidebarSectionProps } from "./shared";
import { PlaygroundTab } from "../playgroundTabs";

// Everything waiting on you personally, as opposed to the board at large.
const FOR_YOU_ROWS: { id: string; label: string; icon: React.ComponentType }[] = [
    { id: PlaygroundTab.Inbox, label: "Inbox", icon: HiOutlineInbox },
    {
        id: PlaygroundTab.AssignedToMe,
        label: "My issues",
        icon: HiOutlineClipboardDocumentList,
    },
    { id: PlaygroundTab.Chats, label: "Chats", icon: HiOutlineAnnotation },
    { id: PlaygroundTab.Reviews, label: "Reviews", icon: HiOutlineCheckCircle },
    { id: PlaygroundTab.SettingsProject, label: "Settings", icon: HiOutlineCog6Tooth },
];

export default function PlaygroundSidebarForYouSection({
    selectedRowId,
    onSelect,
}: SidebarSectionProps) {
    const { data } = useNotifications();
    const unreadCount = data?.unreadCount ?? 0;

    return (
        <Section title="For you">
            {FOR_YOU_ROWS.map((r) => (
                <Row
                    key={r.id}
                    label={r.label}
                    leading={{ kind: "icon", icon: r.icon }}
                    badge={
                        r.id === PlaygroundTab.Inbox && unreadCount > 0 ? unreadCount : undefined
                    }
                    active={selectedRowId === r.id}
                    onClick={() => onSelect(r.id)}
                />
            ))}
        </Section>
    );
}
