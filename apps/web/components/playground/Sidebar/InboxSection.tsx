"use client";
import { HiOutlineAtSymbol, HiOutlineCheckCircle, HiOutlineInbox } from "react-icons/hi2";
import Row from "./SidebarRow";
import Section from "./SidebarSection";
import { type SidebarSectionProps } from "./shared";
import { HomeTab } from "../Home/homeTabs";

// Everything waiting on you personally, as opposed to the board at large.
const INBOX_ROWS: { id: string; label: string; icon: React.ComponentType }[] = [
    { id: HomeTab.Inbox, label: "Inbox", icon: HiOutlineInbox },
    { id: HomeTab.Mentions, label: "Mentions", icon: HiOutlineAtSymbol },
    { id: HomeTab.Reviews, label: "Reviews", icon: HiOutlineCheckCircle },
];

export default function PlaygroundSidebarInboxSection({
    selectedRowId,
    onSelect,
}: SidebarSectionProps) {
    return (
        <Section title="For you">
            {INBOX_ROWS.map((r) => (
                <Row
                    key={r.id}
                    label={r.label}
                    leading={{ kind: "icon", icon: r.icon }}
                    active={selectedRowId === r.id}
                    onClick={() => onSelect(r.id)}
                />
            ))}
        </Section>
    );
}
