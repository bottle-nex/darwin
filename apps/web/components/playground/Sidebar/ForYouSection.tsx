"use client";
import { HiOutlineAtSymbol, HiOutlineCheckCircle } from "react-icons/hi2";
import { HiOutlineAnnotation } from "react-icons/hi";
import Row from "./SidebarRow";
import Section from "./SidebarSection";
import { type SidebarSectionProps } from "./shared";
import { PlaygroundTab } from "../playgroundTabs";

// Everything waiting on you personally, as opposed to the board at large.
const FOR_YOU_ROWS: { id: string; label: string; icon: React.ComponentType }[] = [
    { id: PlaygroundTab.Threads, label: "Threads", icon: HiOutlineAnnotation },
    { id: PlaygroundTab.Mentions, label: "Mentions", icon: HiOutlineAtSymbol },
    { id: PlaygroundTab.Reviews, label: "Reviews", icon: HiOutlineCheckCircle },
];

export default function PlaygroundSidebarForYouSection({
    selectedRowId,
    onSelect,
}: SidebarSectionProps) {
    return (
        <Section title="For you">
            {FOR_YOU_ROWS.map((r) => (
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
